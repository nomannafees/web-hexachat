// Returns an error message, or "" when the value is fine.
// Keep these rules in sync with validateRegistration() in the backend.
export function validateField(name, value) {
  const text = value.trim();

  switch (name) {
    case "name":
      if (!text) return "Name is required.";
      if (text.length > 30) return "Name cannot exceed 30 characters.";
      return "";

    case "username":
      if (!text) return "Username is required.";
       if (/\s/.test(text)) return "Username cannot contain spaces.";
      if (text.length < 3) return "Username must contain at least 3 characters.";
      if (text.length > 30) return "Username cannot exceed 30 characters.";
      return "";

    case "email":
      if (!text) return "Email is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return "Enter a valid email address.";
      return "";

    case "phone":
      if (!text) return "Phone number is required.";
      if (text.replace(/\D/g, "").length < 7) return "Enter a valid phone number.";
      return "";

    case "password":
      if (!value) return "Password is required.";
      if (value.length < 8) return "Password must contain at least 8 characters.";
      return "";

    default:
      return "";
  }
}