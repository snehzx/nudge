import "./App.css";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Room from "./pages/Room";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import ChatLayout from "./layouts/ChatLayout";

const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: "/signin", element: <SignIn /> },
      { path: "/signup", element: <SignUp /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ChatLayout />,
        children: [
          { path: "/", element: <Navigate to="/room/general" replace /> },
          { path: "/room/:roomId", element: <Room /> },
        ],
      },
    ],
  },
  { path: "*", element: <p className="p-4">not found</p> },
]);

function App() {
  return <RouterProvider router={router} />;
}
export default App;
