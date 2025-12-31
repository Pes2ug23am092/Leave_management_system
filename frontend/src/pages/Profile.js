import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/employees/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch profile");
        }

        const data = await response.json();
        setUser(data);

      } catch (err) {
        console.error("Error fetching profile:", err);
        alert(`⚠️ ${err.message}. Please login again.`);
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <p>Loading profile...</p>;
  if (!user) return null;

  return (
    <div className="profile-page">
      <main className="profile-main">
        <div className="profile-top">
          <div className="profile-photo">Photo</div>
          <h3>{user.first_name} {user.last_name}</h3>
          <span className="role">{user.role}</span>
        </div>

        <div className="profile-info">
          <h4>Personal Information</h4>
          <div className="info-field">
            <label>First Name</label>
            <input value={user.first_name ?? ""} readOnly />
          </div>
          <div className="info-field">
            <label>Last Name</label>
            <input value={user.last_name ?? ""} readOnly />
          </div>
          <div className="info-field">
            <label>Email</label>
            <input value={user.email ?? ""} readOnly />
          </div>
          <div className="info-field">
            <label>Role</label>
            <input value={user.role ?? ""} readOnly />
          </div>
          <div className="info-field">
            <label>Designation</label>
            <input value={user.designation ?? ""} readOnly />
          </div>
          <div className="info-field">
            <label>DOB</label>
            <input value={user.dob ?? ""} readOnly />
          </div>
          <div className="info-field">
            <label>Gender</label>
            <input value={user.gender ?? ""} readOnly />
          </div>
          <div className="info-field">
            <label>Manager ID</label>
            <input value={user.manager_id ?? "-"} readOnly />
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        >
          Logout
        </button>
      </main>
    </div>
  );
}

export default Profile;
