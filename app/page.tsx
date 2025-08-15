import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <div className="flex items-center justify-between">
      {/* Logo */}
      <div className="h-9 w-9 grid grid-cols-2 grid-rows-2 font-medium border border-foreground p-0.5 text-xs place-items-center">
        <div>W</div>
        <div>S</div>
        <div>A</div>
        <div>C</div>
      </div>
      <Button className="uppercase rounded-none">Login</Button>
    </div>
  );
};

export default Home;