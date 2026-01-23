/**
 * AIAnalysisCard Component
 * Displays AI-generated synthesis with proper formatting and visual structure
 */

import React, { useMemo } from 'react';
import { Sparkles, Brain, Lightbulb, AlertTriangle, CheckCircle, BookOpen, Target } from 'lucide-react';

/**
 * Parse markdown-style text into structured sections
 */
const parseAnalysis = (text) => {
  if (!text) return { sections: [], raw: '' };

  const sections = [];
  const lines = text.split('\n');
  let currentSection = null;
  let buffer = [];

  const flushBuffer = () => {
    if (buffer.length > 0 && currentSection) {
      currentSection.content = buffer.join('\n').trim();
      if (currentSection.content) {
        sections.push(currentSection);
      }
    }
    buffer = [];
  };

  for (const line of lines) {
    // Check for headers (## or **Header:**)
    const h2Match = line.match(/^##\s+(.+)/);
    const boldHeaderMatch = line.match(/^\*\*([^*]+)\*\*:?\s*$/);
    const numberedHeaderMatch = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*/);

    if (h2Match) {
      flushBuffer();
      currentSection = { type: 'header', title: h2Match[1].trim(), content: '' };
      buffer = [];
    } else if (boldHeaderMatch && !line.includes(':') || (boldHeaderMatch && line.endsWith(':'))) {
      flushBuffer();
      currentSection = { type: 'header', title: boldHeaderMatch[1].trim(), content: '' };
      buffer = [];
    } else if (numberedHeaderMatch) {
      flushBuffer();
      currentSection = {
        type: 'numbered',
        number: numberedHeaderMatch[1],
        title: numberedHeaderMatch[2].trim(),
        content: ''
      };
      // Check if there's content after the header on the same line
      const afterHeader = line.replace(numberedHeaderMatch[0], '').trim();
      if (afterHeader) {
        buffer.push(afterHeader);
      }
    } else if (line.trim()) {
      if (!currentSection) {
        currentSection = { type: 'text', title: '', content: '' };
      }
      buffer.push(line);
    }
  }

  flushBuffer();

  return { sections, raw: text };
};

/**
 * Format inline markdown (bold, italic, links)
 */
const formatInlineMarkdown = (text) => {
  if (!text) return null;

  // Split by markdown patterns while preserving them
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // Italic: *text* (not preceded by *)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+)\*(?!\*)/);

    let firstMatch = null;
    let matchType = null;

    if (boldMatch && (!italicMatch || boldMatch.index <= italicMatch.index)) {
      firstMatch = boldMatch;
      matchType = 'bold';
    } else if (italicMatch) {
      firstMatch = italicMatch;
      matchType = 'italic';
    }

    if (firstMatch) {
      // Add text before match
      if (firstMatch.index > 0) {
        parts.push(<span key={key++}>{remaining.slice(0, firstMatch.index)}</span>);
      }

      // Add formatted text
      if (matchType === 'bold') {
        parts.push(<strong key={key++} className="font-semibold text-white">{firstMatch[1]}</strong>);
      } else {
        parts.push(<em key={key++} className="italic text-gray-200">{firstMatch[1]}</em>);
      }

      remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }
  }

  return parts;
};

/**
 * Render content with bullet points and paragraphs
 */
const ContentRenderer = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let bulletBuffer = [];
  let key = 0;

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      elements.push(
        <ul key={key++} className="space-y-2 my-3">
          {bulletBuffer.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-brand-yellow mt-1.5">•</span>
              <span className="text-gray-300 leading-relaxed">{formatInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for bullet points
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)/);

    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
    } else if (trimmed) {
      flushBullets();
      elements.push(
        <p key={key++} className="text-gray-300 leading-relaxed my-2">
          {formatInlineMarkdown(trimmed)}
        </p>
      );
    }
  }

  flushBullets();

  return <div>{elements}</div>;
};

/**
 * Get icon for section based on title keywords
 */
const getSectionIcon = (title) => {
  const lower = title.toLowerCase();

  if (lower.includes('summary') || lower.includes('overview') || lower.includes('executive')) {
    return <BookOpen className="w-5 h-5" />;
  }
  if (lower.includes('opportunity') || lower.includes('indication') || lower.includes('potential')) {
    return <Target className="w-5 h-5" />;
  }
  if (lower.includes('evidence') || lower.includes('support') || lower.includes('finding')) {
    return <CheckCircle className="w-5 h-5" />;
  }
  if (lower.includes('risk') || lower.includes('limitation') || lower.includes('challenge') || lower.includes('caution')) {
    return <AlertTriangle className="w-5 h-5" />;
  }
  if (lower.includes('recommend') || lower.includes('conclusion') || lower.includes('next')) {
    return <Lightbulb className="w-5 h-5" />;
  }
  if (lower.includes('mechanism') || lower.includes('pathway') || lower.includes('action')) {
    return <Brain className="w-5 h-5" />;
  }

  return <Sparkles className="w-5 h-5" />;
};

/**
 * Get color scheme for section based on title
 */
const getSectionColors = (title, index) => {
  const lower = title.toLowerCase();

  if (lower.includes('risk') || lower.includes('limitation') || lower.includes('caution')) {
    return {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5',
      icon: 'text-amber-400',
      title: 'text-amber-300'
    };
  }
  if (lower.includes('recommend') || lower.includes('conclusion')) {
    return {
      border: 'border-health-green/30',
      bg: 'bg-health-green/5',
      icon: 'text-health-green',
      title: 'text-health-green'
    };
  }

  // Alternate colors for visual variety
  const colorSchemes = [
    { border: 'border-brand-yellow/30', bg: 'bg-brand-yellow/5', icon: 'text-brand-yellow', title: 'text-brand-yellow' },
    { border: 'border-health-teal/30', bg: 'bg-health-teal/5', icon: 'text-health-teal', title: 'text-health-teal' },
    { border: 'border-purple-500/30', bg: 'bg-purple-500/5', icon: 'text-purple-400', title: 'text-purple-300' },
    { border: 'border-blue-500/30', bg: 'bg-blue-500/5', icon: 'text-blue-400', title: 'text-blue-300' },
  ];

  return colorSchemes[index % colorSchemes.length];
};

const AIAnalysisCard = ({ synthesis, drugName }) => {
  const { sections } = useMemo(() => parseAnalysis(synthesis), [synthesis]);

  if (!synthesis) return null;

  // If no sections were parsed, show as a single formatted block
  const hasStructuredContent = sections.length > 0 && sections.some(s => s.type !== 'text');

  return (
    <div className="relative bg-brand-charcoal rounded-2xl border border-white/10 p-6 mb-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-brand-yellow/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-health-teal/5 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/30 rounded-xl">
            <Sparkles className="w-6 h-6 text-brand-yellow" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">AI Analysis</h3>
            <p className="text-sm text-gray-400">
              Comprehensive analysis for <span className="text-brand-yellow font-medium">{drugName}</span> powered by Google Gemini
            </p>
          </div>
        </div>

        {/* Content */}
        {hasStructuredContent ? (
          <div className="space-y-4">
            {sections.map((section, index) => {
              const colors = getSectionColors(section.title || '', index);

              if (section.type === 'text' && !section.title) {
                // Plain text without header
                return (
                  <div key={index} className="text-gray-300 leading-relaxed">
                    <ContentRenderer content={section.content} />
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className={`rounded-xl border ${colors.border} ${colors.bg} p-4 transition-all hover:border-opacity-50`}
                >
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`${colors.icon}`}>
                      {getSectionIcon(section.title)}
                    </div>
                    <h4 className={`font-semibold ${colors.title}`}>
                      {section.type === 'numbered' && (
                        <span className="mr-2">{section.number}.</span>
                      )}
                      {section.title}
                    </h4>
                  </div>

                  {/* Section content */}
                  <div className="pl-8">
                    <ContentRenderer content={section.content} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Fallback for unstructured content
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <ContentRenderer content={synthesis} />
          </div>
        )}

        {/* Footer note */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            This analysis is AI-generated and should be validated through proper clinical and regulatory channels.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisCard;
