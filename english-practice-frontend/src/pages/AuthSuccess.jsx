import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthSuccess = ({ setAuth, setUserRole, setUserId }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const id = searchParams.get('id');

    if (token && role && id) {
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userId', id);
      setAuth(true);
      setUserRole(role);
      setUserId(id);
      
      // Phân quyền dựa trên role
      if (role === 'superadmin' || role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } else {
      navigate('/login?error=missing_params');
    }
  }, [searchParams, navigate, setAuth, setUserRole, setUserId]);

  return (
    <div>
      <h2>Processing your login...</h2>
      <p>Please wait while we redirect you.</p>
    </div>
  );
};

export default AuthSuccess;