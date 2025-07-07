#!/usr/bin/env node

/**
 * Content Generator for Injury Info MCP Server
 * 
 * This generator creates various types of content:
 * - Blog posts about legal cases and settlements
 * - Educational articles about medical conditions
 * - Case studies and success stories
 * - News summaries and updates
 * - FAQ content and guides
 */

import { DataSourcesConnector } from './data-sources-connector.js';

class ContentGenerator {
  constructor() {
    this.dataConnector = new DataSourcesConnector();
  }

  // Blog Post Generator
  async generateBlogPost(topic, type = 'general', wordCount = 800) {
    console.log(`📝 Generating blog post about: ${topic}`);
    
    // Gather relevant data
    const data = await this.dataConnector.getComprehensiveData(topic, ['fda', 'news', 'medical', 'settlements']);
    
    const templates = {
      general: this.getGeneralBlogTemplate(),
      case_study: this.getCaseStudyTemplate(),
      medical: this.getMedicalBlogTemplate(),
      legal: this.getLegalBlogTemplate(),
      news: this.getNewsBlogTemplate()
    };
    
    const template = templates[type] || templates.general;
    return this.fillTemplate(template, { topic, data, wordCount });
  }

  // Educational Article Generator
  async generateEducationalArticle(condition, audience = 'general') {
    console.log(`📚 Generating educational article about: ${condition}`);
    
    const medicalData = await this.dataConnector.getMedicalResearch(condition, 5);
    const safetyData = await this.dataConnector.getSafetyData('CPSC', condition, 3);
    
    const content = {
      title: `Understanding ${condition}: A Comprehensive Guide`,
      introduction: this.generateIntroduction(condition, audience),
      sections: [
        {
          title: 'What is ' + condition + '?',
          content: this.generateDefinition(condition, medicalData)
        },
        {
          title: 'Common Causes and Risk Factors',
          content: this.generateCauses(condition, safetyData)
        },
        {
          title: 'Symptoms and Diagnosis',
          content: this.generateSymptoms(condition, medicalData)
        },
        {
          title: 'Treatment Options',
          content: this.generateTreatments(condition, medicalData)
        },
        {
          title: 'Legal Considerations',
          content: this.generateLegalConsiderations(condition)
        }
      ],
      conclusion: this.generateConclusion(condition),
      sources: this.generateSources(medicalData, safetyData)
    };
    
    return content;
  }

  // Case Study Generator
  async generateCaseStudy(manufacturer, product, condition) {
    console.log(`📋 Generating case study: ${manufacturer} - ${product}`);
    
    const settlements = await this.dataConnector.getSettlementData(manufacturer, condition, 5);
    const recalls = await this.dataConnector.getFDARecalls(product, 3);
    const news = await this.dataConnector.getLegalNews(`${manufacturer} ${product}`, 5);
    
    const caseStudy = {
      title: `${manufacturer} ${product} Case Study: Understanding the Legal Landscape`,
      summary: this.generateCaseSummary(manufacturer, product, condition),
      timeline: this.generateTimeline(settlements, recalls, news),
      keyFacts: this.generateKeyFacts(settlements, recalls),
      legalAnalysis: this.generateLegalAnalysis(settlements, news),
      outcomes: this.generateOutcomes(settlements),
      lessons: this.generateLessons(settlements, recalls),
      resources: this.generateResources(manufacturer, product, condition)
    };
    
    return caseStudy;
  }

  // News Summary Generator
  async generateNewsSummary(keywords, timeframe = 'recent') {
    console.log(`📰 Generating news summary for: ${keywords}`);
    
    const news = await this.dataConnector.getLegalNews(keywords, 10);
    const socialMentions = await this.dataConnector.getSocialMediaMentions(keywords, 'twitter', 5);
    
    const summary = {
      title: `Latest News on ${keywords}: ${timeframe} Update`,
      overview: this.generateNewsOverview(news),
      topStories: this.generateTopStories(news.slice(0, 5)),
      socialBuzz: this.generateSocialBuzz(socialMentions),
      trends: this.generateTrends(news, socialMentions),
      implications: this.generateImplications(news),
      nextSteps: this.generateNextSteps(keywords)
    };
    
    return summary;
  }

  // FAQ Generator
  async generateFAQ(topic, questions = null) {
    console.log(`❓ Generating FAQ for: ${topic}`);
    
    const data = await this.dataConnector.getComprehensiveData(topic, ['fda', 'medical', 'settlements']);
    
    const defaultQuestions = [
      `What is ${topic}?`,
      `What are the symptoms of ${topic}?`,
      `How is ${topic} diagnosed?`,
      `What treatments are available for ${topic}?`,
      `Can I file a lawsuit for ${topic}?`,
      `What compensation might I receive for ${topic}?`,
      `How long do I have to file a ${topic} claim?`,
      `What should I do if I think I have ${topic}?`
    ];
    
    const faqQuestions = questions || defaultQuestions;
    const faq = {
      title: `Frequently Asked Questions About ${topic}`,
      introduction: `Common questions and answers about ${topic}, including medical information, legal options, and next steps.`,
      questions: faqQuestions.map(q => ({
        question: q,
        answer: this.generateFAQAnswer(q, topic, data)
      })),
      resources: this.generateFAQResources(topic)
    };
    
    return faq;
  }

  // Template Methods
  getGeneralBlogTemplate() {
    return {
      title: "{{topic}} - What You Need to Know",
      introduction: "{{topic}} has become a significant concern in recent years, affecting thousands of individuals and families across the country.",
      body: [
        "## Understanding {{topic}}",
        "{{medical_info}}",
        "## Legal Implications",
        "{{legal_info}}",
        "## Recent Developments",
        "{{news_info}}",
        "## What This Means for You",
        "{{implications}}"
      ],
      conclusion: "If you or a loved one has been affected by {{topic}}, it's important to understand your rights and options.",
      callToAction: "Contact our legal team for a free consultation about your {{topic}} case."
    };
  }

  getCaseStudyTemplate() {
    return {
      title: "{{manufacturer}} {{product}} Case Study",
      summary: "A detailed analysis of the {{product}} litigation and its impact on consumer safety.",
      sections: [
        "## Background",
        "{{background}}",
        "## Timeline of Events",
        "{{timeline}}",
        "## Legal Proceedings",
        "{{legal_proceedings}}",
        "## Outcomes and Settlements",
        "{{outcomes}}",
        "## Lessons Learned",
        "{{lessons}}"
      ]
    };
  }

  getMedicalBlogTemplate() {
    return {
      title: "Medical Guide: {{topic}}",
      introduction: "A comprehensive medical overview of {{topic}} for patients and families.",
      sections: [
        "## Medical Definition",
        "{{definition}}",
        "## Symptoms and Diagnosis",
        "{{symptoms}}",
        "## Treatment Options",
        "{{treatments}}",
        "## Prevention and Risk Factors",
        "{{prevention}}"
      ]
    };
  }

  getLegalBlogTemplate() {
    return {
      title: "Legal Guide: {{topic}} Lawsuits",
      introduction: "Understanding your legal rights and options regarding {{topic}}.",
      sections: [
        "## Legal Basis for Claims",
        "{{legal_basis}}",
        "## Statute of Limitations",
        "{{statute}}",
        "## Types of Compensation",
        "{{compensation}}",
        "## Choosing Legal Representation",
        "{{representation}}"
      ]
    };
  }

  getNewsBlogTemplate() {
    return {
      title: "Breaking News: {{topic}}",
      introduction: "Latest developments in {{topic}} cases and settlements.",
      sections: [
        "## Recent Developments",
        "{{developments}}",
        "## Impact on Existing Cases",
        "{{impact}}",
        "## What's Next",
        "{{next_steps}}"
      ]
    };
  }

  // Content Generation Methods
  fillTemplate(template, data) {
    let content = JSON.stringify(template);
    
    // Replace placeholders with actual data
    content = content.replace(/\{\{topic\}\}/g, data.topic);
    content = content.replace(/\{\{medical_info\}\}/g, this.generateMedicalInfo(data.data.medical));
    content = content.replace(/\{\{legal_info\}\}/g, this.generateLegalInfo(data.data.settlements));
    content = content.replace(/\{\{news_info\}\}/g, this.generateNewsInfo(data.data.news));
    content = content.replace(/\{\{implications\}\}/g, this.generateImplications(data.data));
    
    return JSON.parse(content);
  }

  generateIntroduction(topic, audience) {
    const introductions = {
      general: `${topic} affects thousands of people each year, making it crucial to understand both the medical and legal aspects of this condition.`,
      patients: `If you or a loved one has been diagnosed with ${topic}, you likely have many questions about treatment options and legal rights.`,
      legal: `The legal landscape surrounding ${topic} cases continues to evolve, with new settlements and court decisions shaping the future of these claims.`
    };
    
    return introductions[audience] || introductions.general;
  }

  generateDefinition(condition, medicalData) {
    if (medicalData && medicalData.length > 0) {
      return `Based on recent medical research, ${condition} is a serious health condition that requires immediate attention and proper medical care.`;
    }
    return `${condition} is a medical condition that can have significant health implications and may be linked to various environmental or product exposures.`;
  }

  generateCauses(condition, safetyData) {
    if (safetyData && safetyData.length > 0) {
      const causes = safetyData.map(item => item.title).join(', ');
      return `Common causes of ${condition} include exposure to certain products and substances, including ${causes}.`;
    }
    return `The causes of ${condition} can vary, but often include environmental exposures, workplace hazards, or product-related issues.`;
  }

  generateSymptoms(condition, medicalData) {
    return `Symptoms of ${condition} may include pain, fatigue, and other health issues. It's important to consult with a healthcare provider for proper diagnosis.`;
  }

  generateTreatments(condition, medicalData) {
    return `Treatment options for ${condition} depend on the severity and specific circumstances. Common approaches include medication, therapy, and in some cases, surgery.`;
  }

  generateLegalConsiderations(condition) {
    return `If you've been affected by ${condition}, you may have legal rights to compensation. It's important to consult with an experienced attorney to understand your options.`;
  }

  generateConclusion(condition) {
    return `Understanding ${condition} is the first step toward getting the help and compensation you deserve. Don't hesitate to seek both medical and legal assistance.`;
  }

  generateSources(medicalData, safetyData) {
    const sources = [];
    if (medicalData) sources.push(...medicalData.map(item => item.url));
    if (safetyData) sources.push(...safetyData.map(item => item.source));
    return sources;
  }

  generateCaseSummary(manufacturer, product, condition) {
    return `This case study examines the ${manufacturer} ${product} litigation, which has resulted in significant settlements and raised important questions about product safety and consumer protection.`;
  }

  generateTimeline(settlements, recalls, news) {
    const events = [];
    if (settlements) events.push(...settlements.map(s => ({ date: s.date, event: `Settlement: ${s.caseName}` })));
    if (recalls) events.push(...recalls.map(r => ({ date: r.date, event: `Recall: ${r.product}` })));
    if (news) events.push(...news.map(n => ({ date: n.pubDate, event: `News: ${n.title}` })));
    
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  generateKeyFacts(settlements, recalls) {
    const facts = [];
    if (settlements && settlements.length > 0) {
      facts.push(`Total settlements: ${settlements.length}`);
      facts.push(`Average settlement amount: $${this.calculateAverageSettlement(settlements)}`);
    }
    if (recalls && recalls.length > 0) {
      facts.push(`Product recalls: ${recalls.length}`);
    }
    return facts;
  }

  calculateAverageSettlement(settlements) {
    if (!settlements || settlements.length === 0) return 0;
    const amounts = settlements.map(s => parseFloat(s.settlementAmount?.replace(/[$,]/g, '')) || 0);
    const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    return average.toLocaleString();
  }

  generateLegalAnalysis(settlements, news) {
    return `The legal landscape shows a pattern of successful settlements, indicating strong evidence linking the product to health issues. Recent court decisions have favored plaintiffs in similar cases.`;
  }

  generateOutcomes(settlements) {
    if (!settlements || settlements.length === 0) {
      return "Cases are ongoing with no settlements reached yet.";
    }
    return `Successful settlements have been reached in ${settlements.length} cases, providing compensation to affected individuals and families.`;
  }

  generateLessons(settlements, recalls) {
    return "These cases highlight the importance of product safety, consumer awareness, and the need for proper legal representation when dealing with product liability claims.";
  }

  generateResources(manufacturer, product, condition) {
    return [
      "Legal consultation services",
      "Medical evaluation resources",
      "Support groups and advocacy organizations",
      "Government safety databases"
    ];
  }

  generateNewsOverview(news) {
    if (!news || news.length === 0) {
      return "No recent news available on this topic.";
    }
    return `Recent developments include ${news.length} significant news stories, with ${news.filter(n => n.title.includes('settlement')).length} related to settlements.`;
  }

  generateTopStories(news) {
    return news.map(item => ({
      title: item.title,
      summary: item.description,
      date: item.pubDate,
      source: item.source
    }));
  }

  generateSocialBuzz(socialMentions) {
    if (!socialMentions || socialMentions.length === 0) {
      return "Limited social media activity on this topic.";
    }
    return `Social media shows ${socialMentions.length} recent mentions, indicating growing public awareness and concern.`;
  }

  generateTrends(news, socialMentions) {
    return "The trend shows increasing public awareness and legal activity related to this issue.";
  }

  generateImplications(news) {
    return "These developments suggest that affected individuals should act quickly to preserve their legal rights and seek appropriate medical care.";
  }

  generateNextSteps(keywords) {
    return [
      "Consult with a qualified attorney",
      "Get a thorough medical evaluation",
      "Document all relevant information",
      "Stay informed about new developments"
    ];
  }

  generateFAQAnswer(question, topic, data) {
    if (question.includes('What is')) {
      return `${topic} is a serious health condition that can result from various exposures and may require both medical treatment and legal action.`;
    } else if (question.includes('symptoms')) {
      return `Symptoms of ${topic} can vary but often include pain, fatigue, and other health issues. A medical professional should evaluate any concerning symptoms.`;
    } else if (question.includes('lawsuit') || question.includes('claim')) {
      return `Yes, you may be able to file a lawsuit for ${topic} if it was caused by someone else's negligence or a defective product.`;
    } else if (question.includes('compensation')) {
      return `Compensation for ${topic} cases can include medical expenses, lost wages, pain and suffering, and other damages.`;
    } else {
      return `For specific questions about ${topic}, it's best to consult with both a medical professional and a qualified attorney.`;
    }
  }

  generateFAQResources(topic) {
    return [
      "Medical consultation services",
      "Legal consultation services",
      "Support groups",
      "Educational materials"
    ];
  }

  generateMedicalInfo(medicalData) {
    if (!medicalData || medicalData.length === 0) {
      return "Medical research continues to advance our understanding of this condition.";
    }
    return `Recent medical research has provided new insights into this condition, with ${medicalData.length} studies published in peer-reviewed journals.`;
  }

  generateLegalInfo(settlements) {
    if (!settlements || settlements.length === 0) {
      return "Legal cases are ongoing, with new developments occurring regularly.";
    }
    return `Recent legal developments include ${settlements.length} significant settlements, demonstrating the strength of these cases.`;
  }

  generateNewsInfo(news) {
    if (!news || news.length === 0) {
      return "Stay updated on the latest developments through legal and medical news sources.";
    }
    return `Recent news coverage includes ${news.length} articles highlighting important developments in this area.`;
  }
}

// Export for use in MCP server
export { ContentGenerator };

// Example usage
async function main() {
  const generator = new ContentGenerator();
  
  console.log('📝 Testing content generation...');
  
  // Generate a blog post
  const blogPost = await generator.generateBlogPost('mesothelioma', 'medical', 600);
  console.log('Blog post generated:', blogPost.title);
  
  // Generate an educational article
  const article = await generator.generateEducationalArticle('asbestos exposure', 'patients');
  console.log('Educational article generated:', article.title);
  
  // Generate a case study
  const caseStudy = await generator.generateCaseStudy('Johnson & Johnson', 'Talcum Powder', 'ovarian cancer');
  console.log('Case study generated:', caseStudy.title);
  
  // Generate FAQ
  const faq = await generator.generateFAQ('talcum powder cancer');
  console.log('FAQ generated:', faq.title);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 