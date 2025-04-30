import { useState } from 'react';

export default function ProfilePanel({ user }) {
  const [open,setOpen] = useState(false);
  return (
    <section className="info-box">
      <button className="btn" onClick={()=>setOpen(!open)}>
        {open? 'Hide' : 'View'} User Profile
      </button>

      {open && (
        <div>
          <p>Hair Color: {user.hairColor}</p>
          <p>Eye Color: {user.eyeColor}</p>
          <p>Skin Type: {user.skinType}</p>
        </div>
      )}
    </section>
  );
}
