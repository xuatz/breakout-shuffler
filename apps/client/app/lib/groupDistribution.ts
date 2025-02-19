type GroupDistributionMode = 'size' | 'count';

export function calculateGroupDistribution(
  totalParticipants: number,
  mode: GroupDistributionMode,
  value: number
): number[] {
  if (totalParticipants === 0) return [];
  if (value <= 0) return [totalParticipants];

  if (mode === 'size') {
    // Group Size Mode
    const targetSize = value;
    const totalGroups = Math.ceil(totalParticipants / targetSize);

    if (totalGroups === 1) return [totalParticipants];

    // Calculate the minimum size for smaller groups
    const minSize = Math.floor(totalParticipants / totalGroups);
    const remainder = totalParticipants % totalGroups;

    // Create array of minimum sizes
    const distribution = Array(totalGroups).fill(minSize);

    // Distribute the remainder to achieve target size where possible
    let remainingToDistribute = totalParticipants - minSize * totalGroups;
    let index = 0;

    while (remainingToDistribute > 0) {
      const currentAddition = Math.min(
        targetSize - distribution[index],
        remainingToDistribute
      );
      distribution[index] += currentAddition;
      remainingToDistribute -= currentAddition;
      index++;
    }

    // Sort in descending order to have larger groups first
    return distribution.sort((a, b) => b - a);
  } else {
    // Number of Groups Mode
    const targetGroups = Math.min(value, totalParticipants);
    const baseSize = Math.floor(totalParticipants / targetGroups);
    const remainder = totalParticipants % targetGroups;

    return Array(targetGroups)
      .fill(0)
      .map((_, index) => baseSize + (index < remainder ? 1 : 0));
  }
}
