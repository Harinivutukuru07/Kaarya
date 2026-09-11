import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm as useHookForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';
import { FileText, Plus, X, Trash2 } from 'lucide-react';

interface Challan {
  id: string;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  customer: { name: string; businessName: string | null };
  _count: { items: number };
}

const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number({ coerce: true }).int().positive('Quantity must be positive'),
});

const challanSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  items: z.array(challanItemSchema).min(1, 'At least one item is required'),
});

type ChallanForm = z.infer<typeof challanSchema>;

const Challans = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: challans, isLoading } = useQuery({
    queryKey: ['challans'],
    queryFn: async () => {
      const res = await api.get('/challans');
      return res.data;
    }
  });

  const { data: customers } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const res = await api.get('/customers', { params: { limit: 100 } });
      return res.data;
    },
    enabled: isModalOpen,
  });

  const { data: products } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { limit: 100 } });
      return res.data;
    },
    enabled: isModalOpen,
  });

  const { register, control, handleSubmit, reset, formState: { errors } } = useHookForm<ChallanForm>({
    resolver: zodResolver(challanSchema),
    defaultValues: { items: [{ productId: '', quantity: 1 }] }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const createMutation = useMutation({
    mutationFn: (newChallan: ChallanForm) => api.post('/challans', newChallan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      setIsModalOpen(false);
      reset();
    }
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.post(`/challans/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      alert('Challan confirmed successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to confirm challan');
    }
  });

  const onSubmit = (data: ChallanForm) => {
    createMutation.mutate(data);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Sales Challans</h1>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Create Challan
        </button>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>ID</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Date</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Customer</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Items</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Status</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
            ) : challans?.data?.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No challans found</td></tr>
            ) : (
              challans?.data?.map((c: Challan) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                    {c.id.substring(0, 8)}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div>{c.customer.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.customer.businessName}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{c._count.items}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)',
                      background: c.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.1)' : c.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-tertiary)',
                      color: c.status === 'CONFIRMED' ? 'var(--color-success)' : c.status === 'CANCELLED' ? 'var(--color-danger)' : 'var(--color-text-primary)'
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        <FileText size={14} /> View
                      </button>
                      {c.status === 'DRAFT' && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => confirmMutation.mutate(c.id)}
                          disabled={confirmMutation.isPending}
                        >
                          Confirm
                        </button>
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
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '2rem' }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '2rem', background: 'var(--color-bg-secondary)', maxHeight: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Create Draft Challan</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label">Customer</label>
                <select className="form-input" {...register('customerId')}>
                  <option value="">Select a customer...</option>
                  {customers?.data?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} {c.businessName ? `(${c.businessName})` : ''}</option>
                  ))}
                </select>
                {errors.customerId && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.customerId.message}</span>}
              </div>

              <div style={{ margin: '2rem 0', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem' }}>Products</h3>
                  <button type="button" className="btn btn-secondary" onClick={() => append({ productId: '', quantity: 1 })} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    <Plus size={14} /> Add Item
                  </button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flex: 1 }}>
                      <select className="form-input" {...register(`items.${index}.productId` as const)}>
                        <option value="">Select product...</option>
                        {products?.data?.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                        ))}
                      </select>
                      {errors.items?.[index]?.productId && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.items[index]?.productId?.message}</span>}
                    </div>
                    
                    <div style={{ width: '100px' }}>
                      <input type="number" className="form-input" placeholder="Qty" {...register(`items.${index}.quantity` as const)} />
                      {errors.items?.[index]?.quantity && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.items[index]?.quantity?.message}</span>}
                    </div>

                    <button type="button" onClick={() => remove(index)} style={{ padding: '0.5rem', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', marginTop: '4px' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {errors.items && !Array.isArray(errors.items) && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>{errors.items.message}</span>}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challans;
