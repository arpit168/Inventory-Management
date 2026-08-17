import { useEffect, useState, useCallback } from 'react';
import { Building2, Plus, Edit2, Trash2, CheckCircle, Camera, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const BusinessProfile = () => {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  useScrollLock(modalOpen);

  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    logo: '',
    email: '',
    phone: '',
    gstNumber: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    isDefault: false,
  });

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/business-profile');
      setProfiles(res.data.profiles || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch business profiles', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleOpenModal = (profile = null) => {
    if (profile) {
      setEditingProfile(profile);
      setFormData({
        businessName: profile.businessName || '',
        ownerName: profile.ownerName || '',
        logo: profile.logo || '',
        email: profile.email || '',
        phone: profile.phone || '',
        gstNumber: profile.gstNumber || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || 'India',
        postalCode: profile.postalCode || '',
        isDefault: profile.isDefault || false,
      });
    } else {
      setEditingProfile(null);
      setFormData({
        businessName: '',
        ownerName: '',
        logo: '',
        email: '',
        phone: '',
        gstNumber: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        postalCode: '',
        isDefault: profiles.length === 0,
      });
    }
    setModalOpen(true);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size must be under 5MB', 'warning');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('image', file);

    setLogoUploading(true);
    try {
      showToast('Uploading logo...', 'info');
      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData((prev) => ({ ...prev, logo: res.data.url }));
      showToast('Logo uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Logo upload failed', 'error');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.businessName.trim() || !formData.ownerName.trim()) {
      showToast('Business Name and Owner Name are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProfile) {
        await api.put(`/business-profile/${editingProfile._id}`, formData);
        showToast('Business profile updated', 'success');
      } else {
        await api.post('/business-profile', formData);
        showToast('Business profile created', 'success');
      }
      setModalOpen(false);
      fetchProfiles();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save business profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/business-profile/${id}`);
      showToast('Business profile removed', 'success');
      fetchProfiles();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete profile', 'error');
    }
  };

  const handleSetDefault = async (profile) => {
    try {
      await api.put(`/business-profile/${profile._id}`, { ...profile, isDefault: true });
      showToast(`${profile.businessName} set as default shop`, 'success');
      fetchProfiles();
    } catch {
      showToast('Failed to update default status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Business Profiles</h1>
          <p className="text-sm text-text-muted">Manage your shop credentials, branding, and GST for invoices</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover active:scale-95"
        >
          <Plus className="h-4 w-4" /> Add Business Profile
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-surface">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Building2 className="mb-4 h-12 w-12 text-text-muted" />
          <h3 className="text-lg font-bold text-text">No Business Profile Created</h3>
          <p className="mt-1 max-w-md text-sm text-text-muted">
            Set up your shop details, logo, and GST number so they appear automatically on all invoices.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" /> Create First Profile
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <div
              key={p._id}
              className={`relative flex flex-col justify-between rounded-2xl border bg-surface p-6 shadow-sm transition hover:shadow-md ${
                p.isDefault ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
                      {p.logo ? (
                        <img src={p.logo} alt={p.businessName} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-text">{p.businessName}</h3>
                      <p className="text-xs text-text-muted">Owner: {p.ownerName}</p>
                    </div>
                  </div>
                  {p.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      <CheckCircle className="h-3 w-3" /> Default
                    </span>
                  )}
                </div>

                <div className="mt-6 space-y-2 text-xs text-text-muted">
                  {p.gstNumber && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-text" />
                      <span className="font-semibold text-text">GST:</span> {p.gstNumber}
                    </div>
                  )}
                  {p.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-text" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-text" />
                      <span>{p.email}</span>
                    </div>
                  )}
                  {(p.address || p.city) && (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-text" />
                      <span>
                        {[p.address, p.city, p.state, p.postalCode].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                {!p.isDefault ? (
                  <button
                    onClick={() => handleSetDefault(p)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Set as Default
                  </button>
                ) : (
                  <span className="text-xs font-medium text-success">Active Invoice Shop</span>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(p)}
                    className="rounded-lg p-2 text-text-muted transition hover:bg-background hover:text-text"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id, p.businessName)}
                    className="rounded-lg p-2 text-text-muted transition hover:bg-danger/10 hover:text-danger"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold text-text">
                {editingProfile ? 'Edit Business Profile' : 'Add New Business Profile'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-text-muted hover:bg-background hover:text-text"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-background">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo preview" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-8 w-8 text-text-muted" />
                  )}
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition hover:opacity-100">
                    <Camera className="h-6 w-6 text-white" />
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={logoUploading} />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <span className="text-sm font-semibold text-text">Shop Logo</span>
                  <p className="text-xs text-text-muted">Click image to upload. Recommended PNG/JPG under 5MB.</p>
                  {logoUploading && <p className="mt-1 text-xs font-semibold text-primary animate-pulse">Uploading to Cloudinary...</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text">Business / Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Acme Enterprises"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm uppercase text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text">Business Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="shop@example.com"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-text">Address Line</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, Market, or Landmark"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-text">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="ZIP / PIN"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-text cursor-pointer">
                  Set as default shop identity for invoices
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text transition hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || logoUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-primary-hover disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProfile;
