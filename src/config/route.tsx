import { lazy } from 'react'

export default [
  {
    path: '/',
    component: lazy(() => import('@/pages/main'))
  },
  {
    path: '/demo',
    component: lazy(() => import('@/pages/main/demo'))
  }
]
