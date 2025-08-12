import { BrowserRouter, Routes, Route} from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import DashboardView from '@/views/DashboardView'
import CreateProjectView from './views/projects/CreateProjectView'
import EditProjectView from './views/projects/EditProjectView'
import ProjectDetailsViews from './views/projects/ProjectDetailsViews'
import AuthLayout from './layouts/AuthLayout'
import LoginView from './views/auth/LoginView'
import RegisterView from './views/auth/RegisterView'
import ConfirmAccountView from './views/auth/ConfirmAccountView'
import RequestNewCodeView from './views/auth/RequestNewCodeView'
import ForgotPasswordView from './views/auth/ForgotPasswordView'
import NewPasswordView from './views/auth/NewPasswordView'
import ProjectTeamView from './views/projects/ProjectTeamView'
import ProfileView from './views/profile/ProfileView'
import ChangePasswordView from './views/profile/ChangePasswordView'
import ProfileLayout from './layouts/ProfileLayout'
import NotFound from './views/404/NotFound'
import AdminView from './views/admin/AdminView'
import PerformanceAnalyticsView from './views/admin/PerformanceAnalyticsView'
import AutomatedEvaluationView from './views/admin/AutomatedEvaluationView'
import UserPerformanceDashboard from './views/profile/UserPerformanceDashboard'
import NotificationsView from './views/notifications/NotificationsView'

export default function Router(){
    return(
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path='/' element={<DashboardView />} index />
                    <Route path='/projects/create' element={<CreateProjectView />} />
                    <Route path='/projects/:projectId' element={<ProjectDetailsViews />} />
                    <Route path='/projects/:projectId/edit' element={<EditProjectView />} />
                    <Route path='/projects/:projectId/team' element={<ProjectTeamView />} />
                    <Route path='/admin' element={<AdminView />} />
                    <Route path='/admin/performance' element={<PerformanceAnalyticsView />} />
                    <Route path='/admin/performance/automated/:userId' element={<AutomatedEvaluationView />} />
                    <Route element={<ProfileLayout />}> 
                        <Route path='/profile/' element={<ProfileView />} />
                        <Route path='/profile/update-password' element={<ChangePasswordView />} />
                        <Route path='/profile/performance' element={<UserPerformanceDashboard />} />
                        <Route path='/profile/notifications' element={<NotificationsView />} />
                    </Route>
                </Route>

                <Route element={<AuthLayout />}>
                    <Route path='/auth/login' element={<LoginView />} />
                    <Route path='/auth/register' element={<RegisterView />} />
                    <Route path='/auth/confirm-account' element={<ConfirmAccountView />} />
                    <Route path='/auth/request-code' element={<RequestNewCodeView />} />
                    <Route path='/auth/forgot-password' element={<ForgotPasswordView />} />
                    <Route path='/auth/new-password' element={<NewPasswordView />} />
                </Route>

                <Route element={<AuthLayout />}>
                    <Route path='/404' element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}
