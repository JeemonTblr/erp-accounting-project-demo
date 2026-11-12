import * as yup from 'yup';

export const registerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name cannot exceed 120 characters')
    .required('Name is required'),
  email: yup
    .string()
    .trim()
    .email('Invalid email address format')
    .max(150, 'Email cannot exceed 150 characters')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters')
    .required('Password is required'),
  role: yup
    .string()
    .oneOf(['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'], 'Role must be ADMIN, MANAGER, CASHIER, or STAFF')
    .default('CASHIER'),
});

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Invalid email address format')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required'),
});

export const changePasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(6, 'New password must be at least 6 characters')
    .max(100, 'New password cannot exceed 100 characters')
    .required('New password is required'),
});

export const updateUserStatusSchema = yup.object({
  isActive: yup
    .boolean()
    .required('isActive boolean flag is required'),
});

export type RegisterInput = yup.InferType<typeof registerSchema>;
export type LoginInput = yup.InferType<typeof loginSchema>;
export type ChangePasswordInput = yup.InferType<typeof changePasswordSchema>;
export type UpdateUserStatusInput = yup.InferType<typeof updateUserStatusSchema>;

