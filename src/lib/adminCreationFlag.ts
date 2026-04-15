// Shared flag used to prevent UserContext from reacting to the temporary
// auth session change that occurs when an admin creates a new user via signUp().
// signUp() briefly signs in the new user before the admin session is restored,
// which would otherwise trigger a redirect to /login.

let _creating = false;

export const setCreatingUser = (val: boolean) => {
  _creating = val;
};

export const isCreatingUser = () => _creating;
