/* THIS FILE WAS GENERATED FOR THE PAYLOAD ADMIN ROUTE GROUP.
 * It is the root layout for everything under (payload): it renders <html>.
 * The (frontend) group has its own root layout — there is intentionally NO
 * shared src/app/layout.tsx (BUILD-PLAN known trap). */
import type { ServerFunctionClient } from 'payload'
import config from '@payload-config'
import '@payloadcms/next/css'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
