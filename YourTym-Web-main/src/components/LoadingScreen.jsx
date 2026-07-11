import { motion } from "framer-motion";
import { Logo } from "./CommonComponents.jsx";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: [0.9, 1.05, 1],
          opacity: 1,
        }}
        transition={{
          duration: 1,
        }}
      >
        <Logo />
      </motion.div>

      <div className="mt-8 h-2 w-72 overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className="h-full bg-orange-500"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            repeat: Infinity,
            duration: 1.2,
            ease: "linear",
          }}
        />
      </div>

      <motion.p
        className="mt-5 text-gray-500"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{
          repeat: Infinity,
          duration: 1.2,
        }}
      >
        Loading YourTym...
      </motion.p>
    </div>
  );
}