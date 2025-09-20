import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import React from 'react'

const Settings = () => {
  return (
     <DashboardLayout>
             <div className="space-y-6">
               {/* Page Header */}
               <div className="mb-8">
                 <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                 <p className="text-muted-foreground mt-2">
                   Welcome back! Here's what's happening with your dealership today.
                 </p>
               </div>
               </div>
           </DashboardLayout>  
  )
}

export default Settings