import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

// واجهة لتعريف شكل بيانات المنتج
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
}

// بيانات أولية للتطبيق باللغة الكردية
const initialProducts: Product[] = [];

// دالة لتحويل الملف إلى Base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

// مكون الخلفية المتحركة
const BackgroundBlobs: React.FC = () => (
    <div className="blob-container">
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
    </div>
);


// مكون بطاقة المنتج القابلة للتوسيع
const ProductCard: React.FC<{ 
  product: Product; 
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ product, isExpanded, onToggle }) => {
    return (
        <div className={`product-card ${isExpanded ? 'expanded' : ''}`} onClick={onToggle}>
            <div className="product-image" role="img" aria-label={product.name}>
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : '🧀'}
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <div className="product-price-wrapper">
                 <p className="product-price">{`${product.price.toLocaleString()} د.ع`}</p>
                 <svg className="chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
              </div>
            </div>
            <div className="product-description">
                <p>{product.description}</p>
            </div>
        </div>
    );
};

// المكون الرئيسي للتطبيق
const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const savedProducts = localStorage.getItem('sepati-products');
      if (savedProducts) {
        return JSON.parse(savedProducts);
      }
    } catch (error) {
      console.error("Failed to parse products from localStorage", error);
    }
    // If nothing is in localStorage, save the (now empty) initialProducts
    localStorage.setItem('sepati-products', JSON.stringify(initialProducts));
    return initialProducts;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'main' | 'edit'>('main');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  // States for Modals
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('sepati-products', JSON.stringify(products));
    } catch (error) {
      console.error("Failed to save products to localStorage", error);
    }
  }, [products]);


  const handleToggleExpand = (productId: number) => {
    setExpandedProductId(prevId => prevId === productId ? null : productId);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'>, imageFile: File | null, existingId?: number) => {
    let imageUrl = existingId ? products.find(p => p.id === existingId)?.imageUrl : undefined;
    if (imageFile) {
        imageUrl = await toBase64(imageFile);
    }

    if (existingId) {
      setProducts(products.map(p => 
        p.id === existingId ? { ...p, ...productData, imageUrl } : p
      ));
    } else {
      setProducts([...products, { ...productData, id: Date.now(), imageUrl }]);
    }
    setAddModalOpen(false);
    setDetailModalOpen(false);
  };
  
  const handleDeleteProduct = () => {
    if (selectedProduct) {
      setProducts(products.filter(p => p.id !== selectedProduct.id));
      setDetailModalOpen(false);
      setDeleteConfirmOpen(false);
      setSelectedProduct(null);
    }
  };

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalOpen(true);
  };

  const filteredProducts = useMemo(() => 
    products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, searchQuery]);

  return (
    <div className="app-container">
      <BackgroundBlobs />
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={setCurrentView} currentView={currentView} />

      <header className="header">
        <button className="menu-btn" onClick={() => setSidebarOpen(true)} aria-label="پێشەک">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path></svg>
        </button>
        <h1>سپياتي</h1>
        <div className="header-controls">
            {currentView === 'main' && (
              <div className="search-container">
                  <input type="text" placeholder="لێگەڕیان..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
              </div>
            )}
            <button className="add-product-btn" onClick={() => setAddModalOpen(true)} aria-label="زيادەکرنا بەرهەمەکێ نوی">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
                <span>زيادەکرن</span>
            </button>
        </div>
      </header>
      
      {currentView === 'main' ? (
        <main className="product-grid">
          {filteredProducts.map((product, index) => <ProductCard key={product.id} product={product} isExpanded={expandedProductId === product.id} onToggle={() => handleToggleExpand(product.id)} />)}
        </main>
      ) : (
        <EditProductsPage products={products} onEditProduct={openProductDetails} />
      )}

      {isAddModalOpen && <AddEditProductModal onSave={handleSaveProduct} onClose={() => setAddModalOpen(false)} />}
      
      {isDetailModalOpen && selectedProduct && (
        <ProductDetailModal 
          product={selectedProduct} 
          onSave={handleSaveProduct} 
          onClose={() => setDetailModalOpen(false)} 
          onDelete={() => setDeleteConfirmOpen(true)} 
        />
      )}

      {isDeleteConfirmOpen && (
        <ConfirmDeleteModal onConfirm={handleDeleteProduct} onCancel={() => setDeleteConfirmOpen(false)} />
      )}
    </div>
  );
};

// مكون القائمة الجانبية
const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void; onNavigate: (view: 'main' | 'edit') => void; currentView: 'main' | 'edit'; }> = ({ isOpen, onClose, onNavigate, currentView }) => {
  const handleNavigate = (view: 'main' | 'edit') => {
    onNavigate(view);
    onClose();
  };

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>سپياتي</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <ul>
        <li onClick={() => handleNavigate('main')} className={currentView === 'main' ? 'active' : ''} style={{ animationDelay: '100ms' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/></svg>
          <span>رووپەلا سەرەکی</span>
        </li>
        <li onClick={() => handleNavigate('edit')} className={currentView === 'edit' ? 'active' : ''} style={{ animationDelay: '200ms' }}>
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          <span>دەستکاری</span>
        </li>
      </ul>
    </nav>
  );
};

// مكون صفحة إدارة المنتجات
const EditProductsPage: React.FC<{ products: Product[]; onEditProduct: (product: Product) => void; }> = ({ products, onEditProduct }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredProducts = useMemo(() => 
    products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [products, searchQuery]);

  return (
    <div className="edit-products-page">
      <div className="search-container">
        <input type="text" placeholder="لێگەڕیان بۆ بەرهەمەک..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path></svg>
      </div>
      <div className="edit-product-list">
        {filteredProducts.map(product => (
          <div key={product.id} className="edit-product-item" onClick={() => onEditProduct(product)}>
            <img src={product.imageUrl} alt={product.name} className="edit-product-item-image" />
            <div className="edit-product-item-info">
              <h3>{product.name}</h3>
              <p>{`${product.price.toLocaleString()} د.ع`}</p>
            </div>
            <span>›</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// مكون تفاصيل المنتج للتعديل
const ProductDetailModal: React.FC<{ product: Product; onSave: (p: Omit<Product, 'id'>, f: File | null, id: number) => void; onClose: () => void; onDelete: () => void; }> = ({ product, onSave, onClose, onDelete }) => {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState<number | ''>(product.price);
  const [description, setDescription] = useState(product.description);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.imageUrl || null);
  const [isDirty, setDirty] = useState(false);

  useEffect(() => {
    const hasChanged = name !== product.name || Number(price) !== product.price || description !== product.description || imageFile !== null;
    setDirty(hasChanged);
  }, [name, price, description, imageFile, product]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '' || !description) return;
    onSave({ name, price: Number(price), description }, imageFile, product.id);
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2>دەستکاریکرنا بەرهەمی</h2>
            <button type="button" className="close-btn" onClick={onClose} aria-label="گرتن">×</button>
          </div>
          <div className="form-group">
            <label>وێنێ بەرهەمی</label>
            <label htmlFor="image-upload-edit" className="image-uploader">
              {imagePreview ? (<img src={imagePreview} alt="پێشبینین" className="image-preview" />) : (<span>+</span>)}
            </label>
            <input id="image-upload-edit" type="file" accept="image/*" onChange={handleImageChange} />
          </div>
          <div className="form-group">
            <label htmlFor="name-edit">ناڤێ بەرهەمی</label>
            <input id="name-edit" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="price-edit">بها</label>
            <div className="price-input-wrapper">
              <input id="price-edit" type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} required />
              <span>د.ع</span>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="description-edit">پێزانین</label>
            <textarea id="description-edit" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
          </div>

          <div className="form-actions-details">
            <button type="button" className="btn-danger-outline" onClick={onDelete}>ژێبرن</button>
            <div className="main-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>هەڵوەشاندنەوە</button>
              {isDirty && <button type="submit" className="btn-save">پاشکەفتنا گوهۆڕینان</button>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// مكون لإضافة منتج جديد
const AddEditProductModal: React.FC<{ 
    onSave: (product: Omit<Product, 'id'>, imageFile: File | null) => void; 
    onClose: () => void;
}> = ({ onSave, onClose }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '' || !description) return;
    onSave({ name, price: Number(price), description }, imageFile);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>زيادەکرنا بەرهەمەکێ نوی</h2>
          <button className="close-btn" onClick={onClose} aria-label="گرتن">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>وێنێ بەرهەمی</label>
            <label htmlFor="image-upload" className="image-uploader">
              {imagePreview ? <img src={imagePreview} alt="پێشبینینا بەرهەمی" className="image-preview" /> : <span>+ کلیک بکە بۆ هەلبژارتنا وێنەی</span>}
            </label>
            <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} />
          </div>
          <div className="form-group">
            <label htmlFor="name">ناڤێ بەرهەمی</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="price">بها</label>
            <div className="price-input-wrapper">
              <input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} required />
              <span>د.ع</span>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="description">پێزانین</label>
            <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>هەڵوەشاندنەوە</button>
            <button type="submit" className="btn-save">زيادەکرن</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// مكون لتأكيد الحذف
const ConfirmDeleteModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ژێبرنا بەرهەمی</h2>
        </div>
        <p>تو دڵنیای دێ ڤی بەرهەمی ژێبەى؟</p>
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>نەخێر</button>
          <button type="button" className="btn-danger" onClick={onConfirm}>بەلێ، ژێببە</button>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}