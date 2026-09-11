import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { Search, Plus, AlertTriangle, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  minimumStock: number;
}

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number({ coerce: true }).min(0, 'Price must be positive'),
  minimumStock: z.number({ coerce: true }).min(0).default(0),
});
type ProductForm = z.infer<typeof productSchema>;

const Products = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await api.get('/products', { params: { search } });
      return res.data;
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useHookForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { minimumStock: 0, price: 0 }
  });

  const createMutation = useMutation({
    mutationFn: (newProduct: ProductForm) => api.post('/products', newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      reset();
    }
  });

  const onSubmit = (data: ProductForm) => {
    createMutation.mutate(data);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Products</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> New Product
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search products by name or SKU..." 
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Product Name</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>SKU</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Price</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Current Stock</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No products found</td></tr>
            ) : (
              data?.data?.map((p: Product) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '1rem' }}><span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>{p.sku}</span></td>
                  <td style={{ padding: '1rem' }}>₹{p.price.toFixed(2)}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        fontWeight: 600,
                        color: p.stock <= p.minimumStock ? 'var(--color-warning)' : 'var(--color-success)' 
                      }}>
                        {p.stock}
                      </span>
                      {p.stock <= p.minimumStock && (
                        <AlertTriangle size={14} color="var(--color-warning)" title="Low Stock" />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', background: 'var(--color-bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Add Product</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input type="text" className="form-input" {...register('name')} />
                {errors.name && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input type="text" className="form-input" style={{ textTransform: 'uppercase' }} {...register('sku')} />
                {errors.sku && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.sku.message}</span>}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price (₹)</label>
                  <input type="number" step="0.01" className="form-input" {...register('price')} />
                  {errors.price && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.price.message}</span>}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Minimum Stock Alert</label>
                  <input type="number" className="form-input" {...register('minimumStock')} />
                  {errors.minimumStock && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.minimumStock.message}</span>}
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
