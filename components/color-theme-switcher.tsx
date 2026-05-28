"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check } from "lucide-react";
import { useColorTheme, colorThemes, ColorTheme } from "./color-theme-provider";

export function ColorThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const { colorTheme, setColorTheme, colors } = useColorTheme();

  const themes: ColorTheme[] = ["emerald", "cyan", "violet", "amber", "rose"];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-16 right-0 mb-2"
          >
            <div className="relative rounded-2xl border border-white/10 bg-black/90 p-3 backdrop-blur-xl shadow-2xl">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: colors.primary }} />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: colors.primary }} />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: colors.primary }} />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: colors.primary }} />
              
              <div className="mb-2 px-1">
                <span className="font-mono text-xs text-white/50 uppercase tracking-wider">
                  Color Theme
                </span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                {themes.map((theme) => {
                  const themeColors = colorThemes[theme];
                  const isSelected = colorTheme === theme;
                  
                  return (
                    <motion.button
                      key={theme}
                      onClick={() => {
                        setColorTheme(theme);
                        setIsOpen(false);
                      }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative flex items-center gap-3 px-3 py-2 rounded-lg
                        transition-all duration-200 text-left min-w-[140px]
                        ${isSelected 
                          ? "bg-white/10 border border-white/20" 
                          : "hover:bg-white/5 border border-transparent"
                        }
                      `}
                    >
                      {/* Color preview dot */}
                      <motion.div
                        className="relative w-5 h-5 rounded-full"
                        style={{ backgroundColor: themeColors.primary }}
                        animate={{
                          boxShadow: isSelected
                            ? `0 0 20px ${themeColors.primary}80`
                            : "none",
                        }}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <Check className="w-3 h-3 text-black" />
                          </motion.div>
                        )}
                      </motion.div>
                      
                      <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-white/70"}`}>
                        {themeColors.name}
                      </span>
                      
                      {isSelected && (
                        <motion.div
                          layoutId="selectedIndicator"
                          className="absolute right-2 w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: themeColors.primary }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group"
      >
        <motion.div
          className="absolute inset-0 rounded-full blur-xl opacity-50 transition-opacity group-hover:opacity-80"
          style={{ backgroundColor: colors.primary }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <div
          className="relative flex items-center justify-center w-12 h-12 rounded-full border backdrop-blur-xl transition-all duration-300"
          style={{
            backgroundColor: `${colors.primary}20`,
            borderColor: `${colors.primary}50`,
            boxShadow: isOpen ? `0 0 30px ${colors.primary}40` : "none",
          }}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Palette
              className="w-5 h-5"
              style={{ color: colors.primary }}
            />
          </motion.div>
        </div>
        
        {/* Rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-dashed"
          style={{ borderColor: `${colors.primary}30` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </motion.button>
    </div>
  );
}
