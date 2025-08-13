import FireballCanvas from "@/components/FireballCanvas";
import StarfieldCanvas from "@/components/StarfieldCanvas";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-black">
      <StarfieldCanvas />
      <FireballCanvas />
    </div>
  );
};

export default Index;