"use client"

import { APP_SHORT_NAME } from "@/constants/common";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Footer = () => {
    const pathname = usePathname();

    // Only show footer on the landing page (root path)
    const shouldShowFooter = pathname === "/";

    if (!shouldShowFooter) {
        return null;
    }

    return (
        <div className="lg:sticky z-0 bottom-0 w-full max-w-[1440px] mx-auto h-80 bg-teal-500 flex justify-center items-center">
            <div className="relative overflow-hidden w-full h-full flex justify-end p-6 text-right items-start text-background">
                <div className="flex flex-row space-x-12 sm:space-x-16 md:space-x-24 text-lg md:text-xl">
                    {/* <ul>
                        <li className="hover:underline cursor-pointer">Home</li>
                        <li className="hover:underline cursor-pointer">Docs</li>
                        <li className="hover:underline cursor-pointer">Comps</li>
                    </ul> */}
                    <ul>
                        <Link href="https://github.com/thisisindrajit/wsic" target="_blank">
                            <li className="hover:underline cursor-pointer">Github</li>
                        </Link>
                        <li className="hover:underline cursor-pointer">X (Twitter)</li>
                    </ul>
                </div>
                <h2 className="hidden lg:block absolute bottom-0 left-0 translate-y-1/3 sm:text-[192px] text-[80px] text-background">
                    {APP_SHORT_NAME}
                </h2>
            </div>
        </div>
    );
};
export default Footer;