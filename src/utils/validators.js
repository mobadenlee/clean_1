export const validateIssueForm = (form) => {
  const errors = {}

  if (!form.title?.trim()) errors.title = 'Title is required'
  else if (form.title.trim().length < 10) errors.title = 'Title must be at least 10 characters'

  if (!form.category && !form.categoryId) errors.category = 'Please select a category'

  if (!form.state) errors.state = 'Please select your deployment state'

  const descLen = form.description?.trim().length ?? 0
  if (descLen < 50)
    errors.description = `Description must be at least 50 characters (${50 - descLen} more needed)`

  return errors
}

export const validateLoginForm = (form) => {
  const errors = {}
  if (!form.email?.trim()) errors.email = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address'
  if (!form.password) errors.password = 'Password is required'
  return errors
}

export const validateSignupForm = (form) => {
  const errors = {}
  if (!form.name?.trim() || form.name.trim().length < 2) errors.name = 'Full name is required'
  if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address'
  if (!form.state) errors.state = 'Please select your deployment state'
  if (!form.password || form.password.length < 8) errors.password = 'Password must be at least 8 characters'
  return errors
}
