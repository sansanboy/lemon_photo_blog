import Link from "next/link";

type NavbarProps = {
  isAdmin: boolean;
};

export default function Navbar({ isAdmin }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link 
          href="/" 
          className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
        >
          独立摄影师作品集
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link 
            href="/" 
            className="text-gray-300 hover:text-white transition-colors py-1 px-3 rounded-lg hover:bg-gray-800"
          >
            首页
          </Link>
          <Link 
            href="/albums" 
            className="text-gray-300 hover:text-white transition-colors py-1 px-3 rounded-lg hover:bg-gray-800"
          >
            相册
          </Link>
          {isAdmin && (
            <Link 
              href="/admin" 
              className="text-gray-300 hover:text-white transition-colors py-1 px-3 rounded-lg hover:bg-gray-800"
            >
              管理后台
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}