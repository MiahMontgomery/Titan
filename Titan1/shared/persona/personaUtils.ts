import { Persona, ChatMessage, ContentItem, BehaviorUpdate } from "./personaSchema";

/**
 * Helper functions for working with personas
 */

/**
 * Generates a summary of persona performance
 * @param persona The persona to analyze
 * @returns A summarized performance report
 */
export function getPersonaPerformanceSummary(persona: Persona) {
  const {
    totalIncome,
    messageCount,
    responseRate,
    contentCreated,
    contentPublished,
    conversionRate
  } = persona.stats;
  
  // Calculate performance metrics
  const earningsPerMessage = messageCount > 0 ? totalIncome / messageCount : 0;
  const contentEfficiency = contentPublished > 0 ? totalIncome / contentPublished : 0;
  
  return {
    totalIncome,
    messageCount,
    responseRate,
    earningsPerMessage,
    contentEfficiency,
    conversionRate,
    contentCreationRate: contentCreated > 0 ? contentPublished / contentCreated : 0,
  };
}

/**
 * Calculates a performance score for the persona (0-100)
 * @param persona The persona to score
 * @returns A numeric score from 0-100
 */
export function calculatePersonaScore(persona: Persona): number {
  const { stats } = persona;
  
  // These weights can be adjusted based on importance
  const weights = {
    income: 0.4,
    messages: 0.2,
    responseRate: 0.15,
    contentEffectiveness: 0.15,
    conversionRate: 0.1,
  };
  
  // Simple scoring logic - this could be made more sophisticated
  let score = 0;
  
  // Income score (assuming $1000 is a perfect score)
  score += (Math.min(stats.totalIncome, 1000) / 1000) * 100 * weights.income;
  
  // Message activity score (assuming 100 messages is a perfect score)
  score += (Math.min(stats.messageCount, 100) / 100) * 100 * weights.messages;
  
  // Response rate score (already a percentage)
  score += stats.responseRate * weights.responseRate;
  
  // Content effectiveness (published vs created)
  const contentEffectiveness = stats.contentCreated > 0 
    ? (stats.contentPublished / stats.contentCreated) * 100 
    : 0;
  score += contentEffectiveness * weights.contentEffectiveness;
  
  // Conversion rate (already a percentage)
  score += stats.conversionRate * weights.conversionRate;
  
  // Cap at 100
  return Math.min(Math.round(score), 100);
}

/**
 * Organizes chat messages by client
 * @param messages Array of chat messages
 * @returns Messages grouped by client ID
 */
export function groupChatMessagesByClient(messages: ChatMessage[]): Record<string, ChatMessage[]> {
  return messages.reduce((grouped, message) => {
    const clientId = message.clientId || message.sender;
    if (!grouped[clientId]) {
      grouped[clientId] = [];
    }
    grouped[clientId].push(message);
    return grouped;
  }, {} as Record<string, ChatMessage[]>);
}

/**
 * Formats the behavior update instruction for AI model use
 * @param instructions Raw instruction text
 * @param basePersona The original persona
 * @returns Formatted instruction prompt
 */
export function formatBehaviorInstructions(instructions: string, basePersona: Persona): string {
  return `
You are ${basePersona.displayName}, a financial dominatrix with the following traits:
- Tone: ${basePersona.behavior.tone}
- Style: ${basePersona.behavior.style}
- Vocabulary: ${basePersona.behavior.vocabulary}

Your basic instructions are:
${basePersona.behavior.instructions}

However, please adjust your approach with these specific modifications:
${instructions}

Remember to stay in character as ${basePersona.displayName} while incorporating these adjustments.
`;
}

/**
 * Gets content metrics summary for a persona
 * @param contents List of content items for the persona
 * @returns Summary of content performance
 */
export function getContentMetricsSummary(contents: ContentItem[]) {
  const published = contents.filter(c => c.status === "published");
  
  if (published.length === 0) {
    return {
      totalContent: contents.length,
      publishedCount: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalRevenue: 0,
      averageViews: 0,
      averageRevenue: 0,
      engagementRate: 0,
    };
  }
  
  const totalViews = published.reduce((sum, item) => sum + item.metrics.views, 0);
  const totalLikes = published.reduce((sum, item) => sum + item.metrics.likes, 0);
  const totalComments = published.reduce((sum, item) => sum + item.metrics.comments, 0);
  const totalRevenue = published.reduce((sum, item) => sum + item.metrics.revenue, 0);
  
  return {
    totalContent: contents.length,
    publishedCount: published.length,
    totalViews,
    totalLikes,
    totalComments,
    totalRevenue,
    averageViews: published.length > 0 ? totalViews / published.length : 0,
    averageRevenue: published.length > 0 ? totalRevenue / published.length : 0,
    engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0,
  };
}