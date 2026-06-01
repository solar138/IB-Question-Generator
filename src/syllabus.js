export const SYLLABUS = [
  {
    id: "A",
    title: "Topic A: Space, Time and Motion",
    subtopics: [
      { id: "A.1", name: "Kinematics", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "A.2", name: "Forces and momentum", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "A.3", name: "Work, energy and power", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "A.4", name: "Rigid body mechanics (HL only)", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "A.5", name: "Galilean and special relativity (HL only)", slots: [{ level: "remembering" }, { level: "understanding" }] }
    ]
  },
  {
    id: "B",
    title: "Topic B: The Particulate Nature of Matter",
    subtopics: [
      { id: "B.1", name: "Thermal energy transfers", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "B.2", name: "Greenhouse effect", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "B.3", name: "Gas laws", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "B.4", name: "Thermodynamics (HL only)", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "B.5", name: "Current and circuits", slots: [{ level: "remembering" }, { level: "understanding" }] }
    ]
  },
  {
    id: "C",
    title: "Topic C: Wave Behaviour",
    subtopics: [
      { id: "C.1", name: "Simple harmonic motion", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "C.2", name: "Wave model", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "C.3", name: "Wave phenomena", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "C.4", name: "Standing waves and resonance", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "C.5", name: "Doppler effect", slots: [{ level: "remembering" }, { level: "understanding" }] }
    ]
  },
  {
    id: "D",
    title: "Topic D: Fields",
    subtopics: [
      { id: "D.1", name: "Gravitational fields", slots: [{ level: "remembering" }, { level: "understanding (fundamental)" }, { level: "understanding (advanced)" }] },
      { id: "D.2", name: "Electric and magnetic fields", slots: [{ level: "remembering" }, { level: "understanding (fundamental)" }, { level: "understanding (advanced)" }] },
      { id: "D.3", name: "Motion in electromagnetic fields", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "D.4", name: "Induction (HL only)", slots: [{ level: "remembering" }, { level: "understanding" }] }
    ]
  },
  {
    id: "E",
    title: "Topic E: Nuclear and Quantum Physics",
    subtopics: [
      { id: "E.1", name: "Structure of the atom", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "E.2", name: "Quantum physics", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "E.3", name: "Radioactive decay", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "E.4", name: "Fission", slots: [{ level: "remembering" }, { level: "understanding" }] },
      { id: "E.5", name: "Fusion and stars", slots: [{ level: "remembering" }, { level: "understanding" }] }
    ]
  }
];

export const getFlattenedSlots = () => {
  const flattened = [];
  SYLLABUS.forEach(topic => {
    topic.subtopics.forEach(subtopic => {
      subtopic.slots.forEach((slot, index) => {
        flattened.push({
          id: `${subtopic.id}-${slot.level.replace(/\s+/g, "_")}-${index}`,
          topicId: topic.id,
          topicTitle: topic.title,
          subtopicId: subtopic.id,
          subtopicName: subtopic.name,
          level: slot.level,
          slotIndex: index
        });
      });
    });
  });
  return flattened;
};
