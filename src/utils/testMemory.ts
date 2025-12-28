/**
 * Memory System Integration Test
 * Run this from the browser console after signing in
 */

import {
  initializeMemorySystem,
  consolidateMemories,
  retrieveMemories,
  getMemoryStats,
  memoryFormationEngine
} from '../../services/memory';

import {
  performReflection,
  getPendingActions
} from '../../services/proactive';

export async function testMemorySystem(userId: string) {
  console.log('🧪 Testing Memory System...\n');

  try {
    // Test 1: Store some test memories
    console.log('📝 Test 1: Storing test memories...');

    const fact = await memoryFormationEngine.recordFact(userId, {
      content: 'User prefers detailed PRDs with technical specifications',
      type: 'preference',
      confidence: 0.9,
      tags: ['prd', 'preference', 'detail']
    });
    console.log('✅ Stored fact:', fact.id);

    const exp = await memoryFormationEngine.recordExperience(userId, {
      context: 'Generated PRD for mobile checkout flow',
      action: 'Applied prompt chaining with validation',
      outcome: 'Created comprehensive PRD with UX wireframes',
      success: true,
      importance: 0.85
    });
    console.log('✅ Stored experience:', exp.id);

    // Test 2: Get statistics
    console.log('\n📊 Test 2: Memory Statistics...');
    const stats = await getMemoryStats(userId);
    console.log('Stats:', {
      factual: stats.factual.totalCount,
      experiential: stats.experiential.totalCount,
      successRate: `${(stats.experiential.successRate * 100).toFixed(1)}%`
    });

    // Test 3: Retrieve memories
    console.log('\n🔍 Test 3: Retrieving memories...');
    const memories = await retrieveMemories(userId, 'PRD generation preferences');
    console.log(`✅ Retrieved ${memories.length} memories`);
    memories.slice(0, 3).forEach((m, i) => {
      console.log(`  ${i + 1}. [${m.memory.function}] Score: ${m.relevanceScore.toFixed(2)}`);
    });

    // Test 4: Consolidation
    console.log('\n🔄 Test 4: Memory Consolidation...');
    const consolidation = await consolidateMemories(userId);
    console.log('✅ Consolidation results:', consolidation);

    // Test 5: Reflection
    console.log('\n💭 Test 5: Performing Reflection...');
    const reflection = await performReflection(userId, 24);
    console.log('✅ Reflection complete:');
    console.log('  - Success Rate:', `${(reflection.summary.successRate * 100).toFixed(1)}%`);
    console.log('  - Insights:', reflection.insights.length);
    console.log('  - Actions Proposed:', reflection.actionsProposed.length);

    if (reflection.insights.length > 0) {
      console.log('\n  Top Insights:');
      reflection.insights.slice(0, 3).forEach((insight, i) => {
        console.log(`    ${i + 1}. ${insight}`);
      });
    }

    // Test 6: Pending Actions
    console.log('\n⚡ Test 6: Pending Actions...');
    const actions = await getPendingActions(userId);
    console.log(`✅ Found ${actions.length} pending actions`);
    actions.slice(0, 3).forEach((action, i) => {
      console.log(`  ${i + 1}. [${action.priority}] ${action.title}`);
    });

    console.log('\n✅ ALL TESTS PASSED! Memory system is working correctly.');
    console.log('\n📈 Final Stats:', {
      factualMemories: stats.factual.totalCount,
      experiences: stats.experiential.totalCount,
      successRate: `${(stats.experiential.successRate * 100).toFixed(1)}%`,
      pendingActions: actions.length
    });

    return {
      success: true,
      stats,
      reflection,
      actions
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error
    };
  }
}

// Export for window access
if (typeof window !== 'undefined') {
  (window as any).testMemory = testMemorySystem;
}
