import { useState } from 'react';
import { X, Plus, BedDouble, MapPin, IndianRupee, Image, Check } from 'lucide-react';
import api from '@services/api';
import { useAuth } from '@hooks/useAuth';
import Button from '@components/common/Button';
import ErrorBanner from '@components/common/ErrorBanner';

const GREATER_NOIDA_SECTORS = [
  { area: 'Knowledge Park II', coords: [77.495, 28.46] },
  { area: 'Knowledge Park III', coords: [77.488, 28.472] },
  { area: 'Sector Alpha 1', coords: [77.513, 28.471] },
  { area: 'Sector Beta 1 (Pari Chowk)', coords: [77.506, 28.477] },
  { area: 'Sector Delta 2', coords: [77.525, 28.486] },
  { area: 'NRI City, Sector Omega 1', coords: [77.518, 28.455] },
  { area: 'Sector Gamma 2 (Jagat Farm)', coords: [77.502, 28.482] },
  { area: 'Gaur City 1, Greater Noida West', coords: [77.428, 28.605] },
];

const PRESET_AMENITIES = [
  'High-speed WiFi',
  'Air Conditioning',
  'Power Backup',
  'Attached Bath',
  'RO Purifier',
  'Study Table',
  'Washing Machine',
  'Mess / Cook Available',
  'Gated Security',
  'Geyser',
];

const SAMPLE_ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
];

export default function AddListingModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [rent, setRent] = useState('');
  const [roomType, setRoomType] = useState('private');
  const [sectorIndex, setSectorIndex] = useState(0);
  const [address, setAddress] = useState('');
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([
    'High-speed WiFi',
    'Power Backup',
    'RO Purifier',
  ]);
  const [selectedImage, setSelectedImage] = useState(SAMPLE_ROOM_IMAGES[0]);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleAmenity = (name) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a listing title.');
      return;
    }
    if (!rent || Number(rent) <= 0) {
      setError('Please enter a valid monthly rent in Rupees.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const sector = GREATER_NOIDA_SECTORS[sectorIndex];
    const imageUrl = customImageUrl.trim() || selectedImage;

    const payload = {
      title: title.trim(),
      rent: Number(rent),
      roomType,
      availableFrom: new Date(availableFrom),
      description: description.trim(),
      amenities: selectedAmenities,
      images: [imageUrl],
      compatibility: 95,
      location: {
        type: 'Point',
        coordinates: sector.coords,
        area: sector.area,
        city: 'Greater Noida',
        address: address.trim() || `${sector.area}, Greater Noida, Uttar Pradesh`,
      },
      owner: {
        _id: user?._id || 'user-current-session',
        name: user?.name || user?.fullName || 'You (Host)',
        role: 'HAS_ROOM',
        isVerified: true,
      },
    };

    try {
      const { data } = await api.post('/listings', payload);
      const created = data.listing ?? data;
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not post listing. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-[var(--radius)] shadow-lg p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-text">Post a Room in Greater Noida</h2>
            <p className="text-xs text-text-muted mt-0.5">
              List your flat or vacant room to connect with verified students and flatmates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError('')} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text">Listing Title *</label>
            <input
              type="text"
              placeholder="e.g. Furnished Private Room near GL Bajaj & Galgotias"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3.5 py-2 border border-border rounded bg-background text-text text-sm focus:outline-none focus:border-primary"
              required
            />
          </div>

          {/* Rent & Room Type row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text">Monthly Rent (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-semibold">₹</span>
                <input
                  type="number"
                  placeholder="8500"
                  value={rent}
                  onChange={(e) => setRent(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2 border border-border rounded bg-background text-text text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text">Room Type *</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="px-3 py-2 border border-border rounded bg-background text-text text-sm focus:outline-none focus:border-primary"
              >
                <option value="private">Private room</option>
                <option value="shared">Shared room</option>
                <option value="studio">Studio apartment</option>
                <option value="entire">Entire flatshare</option>
              </select>
            </div>
          </div>

          {/* Greater Noida Sector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text">Greater Noida Sector *</label>
              <select
                value={sectorIndex}
                onChange={(e) => setSectorIndex(Number(e.target.value))}
                className="px-3 py-2 border border-border rounded bg-background text-text text-sm focus:outline-none focus:border-primary"
              >
                {GREATER_NOIDA_SECTORS.map((s, idx) => (
                  <option key={s.area} value={idx}>
                    {s.area}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-text">Available Move-in Date</label>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="px-3.5 py-2 border border-border rounded bg-background text-text text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Detailed Address */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text">Full Address / Landmark</label>
            <input
              type="text"
              placeholder="e.g. Plot 14, Near Knowledge Park II Metro Gate, Greater Noida"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="px-3.5 py-2 border border-border rounded bg-background text-text text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-text">Description</label>
            <textarea
              rows={3}
              placeholder="Describe the room, sunlight, quiet hours, proximity to colleges and mess facilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3.5 py-2 border border-border rounded bg-background text-text text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          {/* Amenities checkboxes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text">Select Included Amenities</label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_AMENITIES.map((name) => {
                const isChecked = selectedAmenities.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleAmenity(name)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded border transition-colors text-left ${
                      isChecked
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-background text-text-muted hover:border-stone-300'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-primary border-primary text-white' : 'border-border'
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5" />}
                    </div>
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Choose Room Preview Photo */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-medium text-text">Select Room Photo</label>
            <div className="grid grid-cols-4 gap-2">
              {SAMPLE_ROOM_IMAGES.map((url) => {
                const isSelected = selectedImage === url && !customImageUrl;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => {
                      setSelectedImage(url);
                      setCustomImageUrl('');
                    }}
                    className={`relative h-16 rounded overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="Room option" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="md" isLoading={isSubmitting}>
              Post Room Listing
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
