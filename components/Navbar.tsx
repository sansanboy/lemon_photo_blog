import Link from "next/link";

type NavbarProps = {
    isAdmin: boolean;
};

export default function Navbar({ isAdmin }: NavbarProps) {
    return (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b-[3px]" style={{borderColor: 'var(--wood-medium)'}}>
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-3 hover:opacity-90 transition-opacity"
                >
                    <img
                        src="/logo/apple-touch-icon.png"
                        alt="大军摄影 Logo"
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-md"
                    />
                    <span className="text-lg md:text-xl font-semibold bg-gradient-to-r from-[#6B5344] to-[#A69270] bg-clip-text text-transparent">
                        大军摄影作品集
                    </span>
                </Link>
                <nav className="flex items-center gap-2 text-sm">
                    <Link
                        href="/"
                        className="py-1 px-3 rounded-lg hover:bg-[#F5F0E8] transition-colors"
                        style={{color: '#4A3828'}}
                    >
                        首页
                    </Link>
                    <Link
                        href="/albums"
                        className="py-1 px-3 rounded-lg hover:bg-[#F5F0E8] transition-colors"
                        style={{color: '#4A3828'}}
                    >
                        相册
                    </Link>
                    {isAdmin && (
                        <Link
                            href="/admin"
                            className="py-1 px-3 rounded-lg hover:bg-[#F5F0E8] transition-colors"
                            style={{color: '#4A3828'}}
                        >
                            管理后台
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
