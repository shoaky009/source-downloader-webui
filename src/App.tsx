import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AppLayout } from '@/components/layouts/app-layout'
import { ComponentPage } from '@/pages/component-page'
import { ProcessingContentPage } from '@/pages/processing-content-page'
import { ProcessorPage } from '@/pages/processor-page'
import { SettingPage } from '@/pages/setting-page'

export default function App() {
  return (
    <>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/processor" replace />} />
          <Route path="/processor" element={<ProcessorPage />} />
          <Route path="/component" element={<ComponentPage />} />
          <Route path="/processing-content" element={<ProcessingContentPage />} />
          <Route path="/setting" element={<SettingPage />} />
        </Routes>
      </AppLayout>
      <Toaster richColors position="top-right" />
    </>
  )
}
