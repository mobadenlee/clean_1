import { useState } from 'react'
import { Outlet }  from 'react-router-dom'

import Sidebar      from './Sidebar'
import Header       from './Header'
import MobileHeader from './MobileHeader'

/**
 * Layout for every authenticated route.
 *
 * Previously lived inline inside App.jsx and was selected via local
 * `session ? <AppShell /> : <PublicArea />`. Now it's a Layout Route
 * element — react-router renders the matched child page into <Outlet />.
 *
 * Toast lives at the App root now, so it works on public routes too.
 */
export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <MobileHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <Header />
        <Outlet />
      </div>
    </div>
  )
}
