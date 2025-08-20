import React from 'react';
import { Button } from './ui/button';
import { AlertTriangle, Code, Search, Wrench, Sparkles, X } from 'lucide-react';



const ModeSuggestionBanner = ({
  suggestion,
  onAccept,
  onDismiss
}) => {
  const getModeIcon = (mode) => {
    switch (mode) {
      case 'code':
        return <Code className="w-4 h-4" />;
      case 'research':
        return <Search className="w-4 h-4" />;
      case 'troubleshoot':
        return <Wrench className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getModeColor = (mode) => {
    switch (mode) {
      case 'code':
        return 'border-green-500/30 bg-green-500/10 text-green-400';
      case 'research':
        return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      case 'troubleshoot':
        return 'border-orange-500/30 bg-orange-500/10 text-orange-400';
      default:
        return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
    }
  };

  const modeNames = {
    code: 'Code',
    research: 'Research',
    troubleshoot: 'Troubleshoot',
    standard: 'Standard'
  };

  return (
    <div className="flex justify-center w-full px-6 pt-6">
      <div className={`w-full max-w-3xl border rounded-lg p-6 mb-6 ${getModeColor(suggestion.suggested_mode)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getModeIcon(suggestion.suggested_mode)}
          <span className="text-sm text-gray-300">
            {modeNames[suggestion.suggested_mode]} mode might work better
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => onAccept(suggestion.suggested_mode)}
            size="sm"
            variant="ghost"
            className="h-8 px-3 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
          >
            Switch
          </Button>
          <Button
            onClick={onDismiss}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ModeSuggestionBanner;