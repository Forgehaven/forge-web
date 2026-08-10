import { Routes, Route } from 'react-router-dom'
import { ForgeLayout } from '../../components/ForgeLayout'
import { ToolsSidebar } from './ToolsSidebar'
import { ToolsSettings } from './ToolsSettings'
import { NotFound } from '../../components/NotFound'
import { ToolsBottomBar } from './ToolsBottomBar'
import { ToolsHome } from './ToolsHome'
import { ALL_TOOLS } from './toolsManifest'

const toolsHeaderExtra = (
  <a
    href="https://github.com/forgehaven"
    target="_blank"
    rel="noopener noreferrer"
    className="hidden md:block absolute top-3 right-4 text-xs tracking-widest uppercase text-[#3a3d4a] hover:text-[#6b7280] transition-colors z-10"
  >
    FORGEHAVEN Inc.
  </a>
)

export default function ToolsLayout() {
  return (
    <Routes>
      <Route element={
        <ForgeLayout
          title="Tools"
          homePath="/tools"
          sidebar={ToolsSidebar}
          settings={ToolsSettings}
          bottomBar={ToolsBottomBar}
          headerExtra={toolsHeaderExtra}
        />
      }>
        <Route index element={<ToolsHome />} />

        {ALL_TOOLS.map(({ path, Component }) => (
          <Route key={path} path={path.replace('/tools/', '')} element={<Component />} />
        ))}

        <Route path="*" element={<NotFound backTo="/tools" backLabel="Back to tools" />} />
      </Route>
    </Routes>
  )
}
