import { Routes, Route, Navigate } from 'react-router-dom'

import LandingPage         from '../pages/public/LandingPage'
import LoginPage           from '../pages/public/LoginPage'
import SignupPage          from '../pages/public/SignupPage'

import DashboardHome       from '../pages/dashboard/DashboardHome'
import IssueFeedPage       from '../pages/dashboard/IssueFeedPage'
import IssueDetailPage     from '../pages/dashboard/IssueDetailPage'
import SearchPage          from '../pages/dashboard/SearchPage'
import PostIssuePage       from '../pages/dashboard/PostIssuePage'
import MyIssuesPage        from '../pages/dashboard/MyIssuesPage'
import SavedIssuesPage     from '../pages/dashboard/SavedIssuesPage'
import NotificationsPage   from '../pages/dashboard/NotificationsPage'
import ProfilePage         from '../pages/dashboard/ProfilePage'
import AmbassadorDashboard from '../pages/ambassador/AmbassadorDashboard'

import AppShell        from '../components/layout/AppShell'
import ProtectedRoute  from './ProtectedRoute'
import PublicOnlyRoute from './PublicOnlyRoute'
import AuthCallback    from './AuthCallback'

/**
 * Single source of truth for routing.
 *
 * Public routes (/, /login, /signup) live alongside protected routes
 * (/dashboard, /feed, …) instead of being chosen via local state in App.jsx.
 * Bookmarks, share links, and email-confirmation redirects now all resolve.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public-only — signed-in users get bounced to /dashboard */}
      <Route path="/"       element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
      <Route path="/login"  element={<PublicOnlyRoute><LoginPage  /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignupPage /></PublicOnlyRoute>} />

      {/* OAuth + email-confirmation landing pad. Routes the user based on
          whether a session resolved, so a failed callback can't strand the
          user on /dashboard with nothing rendered. */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected — everything inside the app shell */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/dashboard"     element={<DashboardHome />} />
        <Route path="/feed"          element={<IssueFeedPage />} />
        <Route path="/issue/:id"     element={<IssueDetailPage />} />
        <Route path="/search"        element={<SearchPage />} />
        <Route path="/post-issue"    element={<PostIssuePage />} />
        <Route path="/my-issues"     element={<MyIssuesPage />} />
        <Route path="/saved"         element={<SavedIssuesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile"       element={<ProfilePage />} />
        <Route path="/ambassador"    element={<AmbassadorDashboard />} />
      </Route>

      {/* Unknown URL → landing. PublicOnlyRoute will forward authed users
          straight on to /dashboard. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
