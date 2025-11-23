import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FeederSettings from "./pages/FeederSetting";
import ManualFeed from "./pages/ManualFeed";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Registration page */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element ={<Register/>} />
        <Route path="/dashboard" element ={<Dashboard/>} />
        <Route path="/feederSetting" element ={<FeederSettings/>}/>
        <Route path="/manualFeed" element ={<ManualFeed/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
