import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
  Accessibility, 
  ZoomIn, 
  ZoomOut, 
  Type, 
  Moon, 
  Sun, 
  Contrast, 
  MousePointer2,
} from 'lucide-react';

export default function AccessibilityControls() {
  // Font size control (16px is default)
  const [fontSize, setFontSize] = useState(16);
  
  // High contrast mode
  const [highContrast, setHighContrast] = useState(false);
  
  // Dark mode
  const [darkMode, setDarkMode] = useState(false);
  
  // Screen reader friendly
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  
  // Focus mode (reduces animations and distracting elements)
  const [focusMode, setFocusMode] = useState(false);
  
  // Cursor size
  const [cursorSize, setCursorSize] = useState(1);

  // Apply font size changes
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);
  
  // Apply high contrast
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);
  
  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Apply screen reader friendly mode
  useEffect(() => {
    if (screenReaderMode) {
      document.documentElement.classList.add('screen-reader-mode');
    } else {
      document.documentElement.classList.remove('screen-reader-mode');
    }
  }, [screenReaderMode]);
  
  // Apply focus mode
  useEffect(() => {
    if (focusMode) {
      document.documentElement.classList.add('focus-mode');
    } else {
      document.documentElement.classList.remove('focus-mode');
    }
  }, [focusMode]);
  
  // Apply cursor size
  useEffect(() => {
    const size = cursorSize * 16; // Base size in pixels
    
    // Create or update the cursor style
    let style = document.getElementById('custom-cursor-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'custom-cursor-style';
      document.head.appendChild(style);
    }
    
    if (cursorSize > 1) {
      style.innerHTML = `
        * {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="rgba(0,0,0,0.5)" /></svg>') ${size/2} ${size/2}, auto !important;
        }
      `;
    } else {
      style.innerHTML = '';
    }
  }, [cursorSize]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="secondary" aria-label="Accessibility Options">
            <Accessibility className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[350px]">
          <SheetHeader>
            <SheetTitle>Accessibility Controls</SheetTitle>
            <SheetDescription>
              Customize your viewing experience to meet your needs.
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            {/* Font Size Control */}
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <Type className="h-4 w-4" /> Text Size
              </h3>
              <div className="flex items-center gap-4">
                <ZoomOut className="h-4 w-4 text-gray-500" />
                <Slider 
                  className="flex-1" 
                  value={[fontSize]} 
                  min={12} 
                  max={24} 
                  step={1}
                  onValueChange={(value) => setFontSize(value[0])}
                  aria-label="Adjust text size"
                />
                <ZoomIn className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 mt-1">Current: {fontSize}px</p>
            </div>
            
            {/* Cursor Size */}
            <div>
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                <MousePointer2 className="h-4 w-4" /> Cursor Size
              </h3>
              <div className="flex items-center gap-4">
                <ZoomOut className="h-4 w-4 text-gray-500" />
                <Slider 
                  className="flex-1" 
                  value={[cursorSize]} 
                  min={1} 
                  max={3} 
                  step={0.2}
                  onValueChange={(value) => setCursorSize(value[0])}
                  aria-label="Adjust cursor size"
                />
                <ZoomIn className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {cursorSize === 1 ? 'Default size' : `${Math.round(cursorSize * 100)}% larger`}
              </p>
            </div>
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
              <Switch 
                id="dark-mode" 
                checked={darkMode} 
                onCheckedChange={setDarkMode}
                aria-label="Toggle dark mode"
              />
            </div>
            
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Contrast className="h-4 w-4" />
                <Label htmlFor="high-contrast">High Contrast</Label>
              </div>
              <Switch 
                id="high-contrast" 
                checked={highContrast} 
                onCheckedChange={setHighContrast}
                aria-label="Toggle high contrast mode"
              />
            </div>
            
            {/* Screen Reader Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Accessibility className="h-4 w-4" />
                <Label htmlFor="screen-reader">Screen Reader Support</Label>
              </div>
              <Switch 
                id="screen-reader" 
                checked={screenReaderMode} 
                onCheckedChange={setScreenReaderMode}
                aria-label="Toggle screen reader optimizations"
              />
            </div>
            
            {/* Focus Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Label htmlFor="focus-mode">Focus Mode</Label>
              </div>
              <Switch 
                id="focus-mode" 
                checked={focusMode} 
                onCheckedChange={setFocusMode}
                aria-label="Toggle focus mode"
              />
            </div>
            
            {/* Reset Button */}
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => {
                setFontSize(16);
                setHighContrast(false);
                setDarkMode(false);
                setScreenReaderMode(false);
                setFocusMode(false);
                setCursorSize(1);
              }}
            >
              Reset to Defaults
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}