/**
 * Example PM goals for testing Intent Interpreter
 */

export const exampleGoals = [
  // PRD Generation
  {
    goal: 'Create a detailed PRD for an AI Tutor module for Class 6-10',
    expectedType: 'document',
    expectedAgents: ['research', 'prd_writer'],
    expectedTasks: 3
  },

  // Competitive Analysis
  {
    goal: 'Analyze Notion vs Linear vs Coda and give me a summary of their key features',
    expectedType: 'analysis',
    expectedAgents: ['research', 'analyst'],
    expectedTasks: 3
  },

  // Jira Story Creation
  {
    goal: 'Convert this PRD into 12 actionable Jira stories with acceptance criteria',
    expectedType: 'workflow',
    expectedAgents: ['analyst', 'jira_manager'],
    expectedTasks: 2
  },

  // Prototype Building
  {
    goal: 'Design a user onboarding flow with 3 variants to A/B test',
    expectedType: 'prototype',
    expectedAgents: ['ux_writer', 'analyst'],
    expectedTasks: 4
  },

  // Communication
  {
    goal: 'Draft a product update email for our users about the new AI features',
    expectedType: 'document',
    expectedAgents: ['communication'],
    expectedTasks: 2
  },

  // Multi-step Workflow
  {
    goal: 'Research top 5 project management tools, analyze their pricing, and create a comparison doc in Notion',
    expectedType: 'workflow',
    expectedAgents: ['research', 'analyst', 'communication'],
    expectedTasks: 4
  },

  // User Flow Design
  {
    goal: 'Create user flows for a checkout process with guest and logged-in variants',
    expectedType: 'document',
    expectedAgents: ['ux_writer'],
    expectedTasks: 2
  },

  // Experiment Design
  {
    goal: 'Design an A/B test for three different pricing page layouts and simulate 1000 users',
    expectedType: 'experiment',
    expectedAgents: ['ux_writer', 'analyst'],
    expectedTasks: 3
  },

  // Feature Specification
  {
    goal: 'Write technical requirements for a real-time notification system',
    expectedType: 'document',
    expectedAgents: ['prd_writer', 'analyst'],
    expectedTasks: 3
  },

  // Backlog Grooming
  {
    goal: 'Review our Jira backlog and prioritize top 20 tickets by impact',
    expectedType: 'analysis',
    expectedAgents: ['jira_manager', 'analyst'],
    expectedTasks: 3
  }
];

/**
 * Test all example goals and validate outputs
 */
export async function testAllExamples() {
  const { parseIntent } = await import('./interpreter');

  console.log('🧪 Testing Intent Interpreter with example goals...\n');

  const results = [];

  for (let i = 0; i < exampleGoals.length; i++) {
    const example = exampleGoals[i];
    console.log(`\n📝 Example ${i + 1}: "${example.goal}"\n`);

    try {
      const intent = await parseIntent(example.goal);

      console.log(`✅ Parsed successfully`);
      console.log(`   Type: ${intent.type} (expected: ${example.expectedType})`);
      console.log(`   Agents: ${intent.agents.join(', ')}`);
      console.log(`   Tasks: ${intent.tasks.length}`);
      console.log(`   Confidence: ${(intent.confidence * 100).toFixed(0)}%`);
      console.log(`   Duration: ~${intent.estimated_duration}s`);

      if (intent.ambiguities.length > 0) {
        console.log(`   ⚠️  Ambiguities: ${intent.ambiguities.join('; ')}`);
      }

      results.push({
        goal: example.goal,
        success: true,
        intent
      });

    } catch (error) {
      console.log(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      results.push({
        goal: example.goal,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  console.log('\n\n📊 Summary:');
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ ${successCount}/${results.length} examples parsed successfully`);
  console.log(`❌ ${results.length - successCount}/${results.length} failed\n`);

  return results;
}
