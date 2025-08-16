"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const TopBar = () => {
    const pathname = usePathname();

    return (
        <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
                <div className="h-9 w-9 grid grid-cols-2 grid-rows-2 font-medium border border-foreground p-0.5 text-xs place-items-center cursor-pointer">
                    <div>W</div>
                    <div>S</div>
                    <div>I</div>
                    <div>C</div>
                </div>
            </Link>
            {pathname !== "/login" && (
                <Link href="/login">
                    <Button className="uppercase cursor-pointer">Login</Button>
                </Link>
            )}
        </div>
    )
}

export default TopBar;