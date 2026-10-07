import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const VerifyEmail = () => {
  const [html, setHtml] = useState("<h1>Verifying...</h1>");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setHtml("<h2>No verification token provided</h2>");
      return;
    }

    fetch(`http://localhost:5000/api/auth/verify-email?token=${token}`)
      .then(async res => {
        const text = await res.text();
        setHtml(text);
      })
      .catch(error => {
        setHtml("<h2>Verification failed due to network error</h2>");
      });
  }, [token]);

  return (
    <div dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default VerifyEmail;