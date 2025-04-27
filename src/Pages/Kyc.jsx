import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const KycPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    dob: '',
    aadharNumber: '',
    frontImage: null,
    backImage: null
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [type]: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // Upload front image
      const frontImagePath = `${user.id}/front_${Date.now()}`;
      const { error: frontUploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(frontImagePath, formData.frontImage, {
          cacheControl: '3600',
          upsert: false
        });
      if (frontUploadError) throw frontUploadError;

      // Upload back image
      const backImagePath = `${user.id}/back_${Date.now()}`;
      const { error: backUploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(backImagePath, formData.backImage, {
          cacheControl: '3600',
          upsert: false
        });
      if (backUploadError) throw backUploadError;

      // Get public URLs for the uploaded images
      const { data: { publicUrl: frontImageUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(frontImagePath);

      const { data: { publicUrl: backImageUrl } } = supabase.storage
        .from('kyc-documents')
        .getPublicUrl(backImagePath);

      // Store KYC data in the database
      const { error: dbError } = await supabase
        .from('kyc_submissions')
        .insert([
          {
            user_id: user.id,
            first_name: formData.firstName,
            email: formData.email,
            date_of_birth: formData.dob,
            aadhar_number: formData.aadharNumber,
            front_image_url: frontImageUrl,
            back_image_url: backImageUrl,
            status: 'pending',
            submitted_at: new Date().toISOString()
          }
        ]);

      if (dbError) throw dbError;

      alert('KYC submitted successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error submitting KYC:', error);
      alert(`Error submitting KYC: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kyc-wrapper">
      <div className="kyc-container">
        <p className="instruction">
          You need to submit a document that shows you are <b>above 18 years</b> of age and not a resident of
          <b> Assam, Odisha, Sikkim, Nagaland, Telangana, Andhra Pradesh, Tamil Nadu, and Karnataka</b>.
        </p>

        <form className="aadhar-form" onSubmit={handleSubmit}>
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            placeholder="Enter Name"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />

          <label htmlFor="email">Email ID</label>
          <input
            type="email"
            id="email"
            placeholder="Email ID"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          <label htmlFor="dob">Date of Birth</label>
          <input
            type="text"
            id="dob"
            placeholder="DD/MM/YYYY"
            value={formData.dob}
            onChange={handleInputChange}
            required
          />

          <label htmlFor="aadharNumber">Aadhar Number</label>
          <input
            type="text"
            id="aadharNumber"
            placeholder="Aadhar Number"
            value={formData.aadharNumber}
            onChange={handleInputChange}
            required
          />

          <div className="upload-box">
            <p>Upload front photo of your Aadhar Card.</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'frontImage')}
              required
            />
          </div>

          <div className="upload-box">
            <p>Upload back photo of your Aadhar Card.</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'backImage')}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default KycPage;
