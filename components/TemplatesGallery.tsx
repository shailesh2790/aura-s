import React, { useState } from 'react';
import { BUSINESS_TEMPLATES, getPopularTemplates, searchTemplates } from '../data/businessTemplates';
import { BusinessTemplate } from '../types/advanced';
import { Search, Zap, Clock, TrendingUp, ChevronRight, Star, Check } from 'lucide-react';

interface TemplatesGalleryProps {
  onSelectTemplate: (template: BusinessTemplate) => void;
}

export const TemplatesGallery: React.FC<TemplatesGalleryProps> = ({ onSelectTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<BusinessTemplate | null>(null);

  const categories = [
    { id: 'all', label: 'All Templates', icon: '🎯' },
    { id: 'e-commerce', label: 'E-commerce', icon: '🛍️' },
    { id: 'saas', label: 'SaaS', icon: '🚀' },
    { id: 'customer-support', label: 'Support', icon: '🎫' },
    { id: 'sales', label: 'Sales', icon: '📈' },
    { id: 'marketing', label: 'Marketing', icon: '📱' },
    { id: 'finance', label: 'Finance', icon: '💰' }
  ];

  const complexityColors = {
    beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
    intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    advanced: 'bg-red-500/20 text-red-400 border-red-500/30'
  };

  const filteredTemplates = searchQuery
    ? searchTemplates(searchQuery)
    : selectedCategory === 'all'
    ? BUSINESS_TEMPLATES
    : BUSINESS_TEMPLATES.filter(t => t.category === selectedCategory);

  const popularTemplates = getPopularTemplates(3);

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-950 to-blue-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Business Automation Templates</h1>
          <p className="text-gray-400 text-lg">
            Production-ready workflows with proven ROI. Select a template and start automating in minutes.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates... (e.g., 'abandoned cart', 'support', 'email')"
              className="w-full bg-slate-800/50 border border-blue-500/30 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Popular Templates Banner */}
        {!searchQuery && selectedCategory === 'all' && (
          <div className="mb-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Most Popular</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="bg-slate-800/50 border border-blue-500/30 rounded-lg p-4 text-left hover:bg-slate-700/50 transition group"
                >
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <h3 className="text-white font-semibold mb-1 group-hover:text-blue-400 transition">
                    {template.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2">{template.description}</p>
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>{template.roi}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg border transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-gray-300 hover:bg-slate-700/50'
              }`}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6 hover:border-blue-500 transition cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{template.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{template.name}</h3>
                    <p className="text-gray-400 text-sm">{template.description}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${complexityColors[template.complexity]}`}>
                  {template.complexity}
                </span>
              </div>

              {/* Use Case */}
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">{template.useCase}</p>
              </div>

              {/* ROI */}
              <div className="mb-4 flex items-center gap-2 text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">{template.roi}</span>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{template.estimatedSetupTime} min setup</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  <span>{template.requiredIntegrations.length} integrations</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {template.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-slate-700/50 text-gray-300 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTemplate(template);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
              >
                <span>View Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No templates found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-blue-400 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onUseTemplate={onSelectTemplate}
        />
      )}
    </div>
  );
};

// Template Detail Modal
const TemplateDetailModal: React.FC<{
  template: BusinessTemplate;
  onClose: () => void;
  onUseTemplate: (template: BusinessTemplate) => void;
}> = ({ template, onClose, onUseTemplate }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-blue-500/30 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="text-5xl">{template.icon}</div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">{template.name}</h2>
              <p className="text-gray-400">{template.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* ROI Banner */}
          <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-semibold">Expected ROI</span>
            </div>
            <p className="text-white text-lg">{template.roi}</p>
          </div>

          {/* Use Case */}
          <div>
            <h3 className="text-white font-semibold mb-2">Use Case</h3>
            <p className="text-gray-300">{template.useCase}</p>
          </div>

          {/* Long Description */}
          <div>
            <h3 className="text-white font-semibold mb-2">How It Works</h3>
            <p className="text-gray-300">{template.longDescription}</p>
          </div>

          {/* Required Integrations */}
          <div>
            <h3 className="text-white font-semibold mb-3">Required Integrations</h3>
            <div className="grid grid-cols-2 gap-2">
              {template.requiredIntegrations.map((int) => (
                <div
                  key={int}
                  className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
                >
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 capitalize">{int}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Integrations */}
          {template.optionalIntegrations.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">Optional Integrations</h3>
              <div className="grid grid-cols-2 gap-2">
                {template.optionalIntegrations.map((int) => (
                  <div
                    key={int}
                    className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg"
                  >
                    <span className="text-gray-500 capitalize">{int}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testimonials */}
          {template.testimonials && template.testimonials.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">Success Stories</h3>
              {template.testimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/50 border border-blue-500/20 rounded-lg p-4 mb-3"
                >
                  <p className="text-gray-300 italic mb-2">"{testimonial.quote}"</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      {testimonial.company} - {testimonial.role}
                    </p>
                    {testimonial.metrics && (
                      <span className="text-sm text-green-400 font-semibold">
                        {testimonial.metrics}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Setup Time */}
          <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Clock className="w-6 h-6 text-blue-400" />
            <div>
              <p className="text-white font-semibold">Estimated Setup Time</p>
              <p className="text-gray-400">{template.estimatedSetupTime} minutes</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            Close
          </button>
          <button
            onClick={() => {
              onUseTemplate(template);
              onClose();
            }}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-semibold"
          >
            Use This Template →
          </button>
        </div>
      </div>
    </div>
  );
};
