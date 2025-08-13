import FireballCanvas from "@/components/FireballCanvas";
import StarfieldCanvas from "@/components/StarfieldCanvas";
import UI from "@/components/UI";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-black">
      <StarfieldCanvas />
      <FireballCanvas />
      <UI />
    </div>
  );
};

export default Index;