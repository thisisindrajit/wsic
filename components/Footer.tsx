import { APP_SHORT_NAME } from "@/constants/common";

const Footer = () => {
    return (
        <div className="lg:sticky z-0 bottom-0 left-0 w-full h-80 bg-teal-500 flex justify-center items-center">
            <div className="relative overflow-hidden w-full h-full flex justify-end px-12 text-right items-start py-12 text-background">
                <div className="flex flex-row space-x-12 sm:space-x-16 md:space-x-24 text-lg md:text-xl">
                    {/* <ul>
                        <li className="hover:underline cursor-pointer">Home</li>
                        <li className="hover:underline cursor-pointer">Docs</li>
                        <li className="hover:underline cursor-pointer">Comps</li>
                    </ul> */}
                    <ul>
                        <li className="hover:underline cursor-pointer">Github</li>
                        <li className="hover:underline cursor-pointer">X (Twitter)</li>
                    </ul>
                </div>
                <h2 className="absolute bottom-0 left-0 translate-y-1/3 sm:text-[192px] text-[80px] text-background">
                    {APP_SHORT_NAME}
                </h2>
            </div>
        </div>
    );
};
export default Footer;