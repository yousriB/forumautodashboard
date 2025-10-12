import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole, brands, roleColors } from '@/types/user.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Base schema for both create and edit
export const baseUserFormSchema = {
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'sales', 'support']),
  brand: z.string().optional(),
} as const;

// Schema for creating a new user
export const createUserSchema = z.object({
  ...baseUserFormSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Schema for updating a user (password is optional)
export const updateUserSchema = z.object({
  ...baseUserFormSchema,
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

export type UserFormData = z.infer<typeof createUserSchema>;

interface UserFormProps {
  defaultValues?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditMode?: boolean;
}

export const UserForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEditMode = false,
}: UserFormProps) => {
  const form = useForm<UserFormData>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'support',
      brand: '',
      ...defaultValues,
    },
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form;

  const selectedRole = watch('role');

  const handleFormSubmit = (data: UserFormData) => {
    // For update mode, remove password if it's empty
    if (isEditMode && !data.password) {
      const { password, ...dataWithoutPassword } = data;
      onSubmit(dataWithoutPassword as UserFormData);
    } else {
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            disabled={isSubmitting || isEditMode}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            {isEditMode ? 'New Password (leave blank to keep current)' : 'Password'}
          </Label>
          <Input
            id="password"
            type="password"
            placeholder={isEditMode ? '••••••' : '••••••'}
            disabled={isSubmitting}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={selectedRole}
            onValueChange={(value) => setValue('role', value as UserRole)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleColors).map(([role, className]) => (
                <SelectItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Brand (only show for sales role) */}
        {selectedRole === 'sales' && (
          <div className="space-y-2">
            <Label>Brand</Label>
            <Select
              onValueChange={(value) => setValue('brand', value)}
              defaultValue={defaultValues.brand}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isEditMode ? 'Updating...' : 'Creating...'}
            </span>
          ) : isEditMode ? (
            'Update User'
          ) : (
            'Create User'
          )}
        </Button>
      </div>
    </form>
  );
};
