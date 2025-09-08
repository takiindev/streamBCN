import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Stream from "./pages/Stream";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div className="p-4">Trang chủ</div>} />
        <Route path="/stream" element={<Stream />} />
      </Routes>
    </Router>
  );
}

export default App
