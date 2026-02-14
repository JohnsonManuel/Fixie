import { motion } from "framer-motion";
import React from 'react';
import { Highlight } from '../ui/hero-highlight';

const ProblemStatement: React.FC = () => (
    <div className='w-full bg-white dark:bg-neutral-900'>
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="max-w-4xl mx-auto text-center px-4 py-20 text-gray-900 "
    >
<h1 className="text-2xl md:text-6xl leading-relaxed font-bold text-gray-900 dark:text-white">
  <span className="inline-block mb-2">Simplify IT Support with</span>{" "}</h1>
  <h1 className="text-2xl md:text-6xl mt-5 leading-relaxed font-bold text-gray-900 dark:text-white">
  <Highlight className="inline-block text-black dark:text-white">
    Chat-first
  </Highlight> Resolution.
  </h1>
      <p className="mt-6 text-lg md:text-xl leading-relaxed text-gray-700 dark:text-gray-400">
        Fixie provides employees with a simple chat interface to resolve common
        IT issues – such as password resets and access requests – without
        requiring helpdesk intervention. By masking IT complexity behind a
        conversational experience, Fixie resolves the majority of Level-1
        tickets automatically while integrating seamlessly with existing IT
        systems, reducing support costs and improving employee productivity.
      </p>
    </motion.div>
    </div>
);

export default ProblemStatement;
