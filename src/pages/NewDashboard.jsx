
function NewDashboard() {
    return (
        <div>
            <div className="flex">
                <nav className="w-64 bg-gray-800 text-white min-h-screen p-4">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold">Dashboard</h2>
                    </div>
                    <ul className="space-y-2">
                        <li>
                            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">
                                Trang chủ
                            </a>
                        </li>
                        <li>
                            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">
                                Thống kê
                            </a>
                        </li>
                        <li>
                            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">
                                Người dùng
                            </a>
                        </li>
                        <li>
                            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-700">
                                Cài đặt
                            </a>
                        </li>
                    </ul>
                </nav>
                <main className="flex-1 p-6">
                    <h1 className="text-2xl font-bold mb-4">Nội dung chính</h1>
                </main>
            </div>
        </div>
    )
}

export default NewDashboard;