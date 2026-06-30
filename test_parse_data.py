import unittest
from parse_data import clean_event_name

class TestCleanEventName(unittest.TestCase):
    def test_clean_event_name_happy_path(self):
        # Test basic section extraction
        self.assertEqual(clean_event_name("Some Event - Section 2"), ("Some Event", "Section 2"))

        # Test objective extraction
        self.assertEqual(clean_event_name("Some Event - Objective Test"), ("Some Event", "Objective Test"))
        self.assertEqual(clean_event_name("Another Event - Objective"), ("Another Event", "Objective Test"))

        # Test complex nested suffixes
        self.assertEqual(clean_event_name("Event Name - Prelims - Section 1 - Presentation"), ("Event Name", "Section 1"))
        self.assertEqual(clean_event_name("Event Name - Prelims - Section 3"), ("Event Name", "Section 3"))

        # Test performance and presentation suffixes
        self.assertEqual(clean_event_name("Event - Performance"), ("Event", "Main"))
        self.assertEqual(clean_event_name("Event - Presentation"), ("Event", "Main"))

    def test_clean_event_name_edge_cases(self):
        # Empty string
        self.assertEqual(clean_event_name(""), ("", "Main"))

        # String without any expected patterns
        self.assertEqual(clean_event_name("Regular Event Name"), ("Regular Event Name", "Main"))

        # String with random special characters
        self.assertEqual(clean_event_name("!!! Random Event ???"), ("!!! Random Event ???", "Main"))

        # Strings with only dashes/spaces
        self.assertEqual(clean_event_name(" - "), ("", "Main"))
        self.assertEqual(clean_event_name("   "), ("", "Main"))
        self.assertEqual(clean_event_name("---"), ("", "Main"))

        # String with section mentioned without dashes
        self.assertEqual(clean_event_name("Event Section 5"), ("Event Section 5", "Section 5"))

        # Case insensitivity test
        self.assertEqual(clean_event_name("Event - PRELIMS - SECTION 12"), ("Event", "Section 12"))
        self.assertEqual(clean_event_name("event - objective TEST"), ("event", "Objective Test"))

if __name__ == '__main__':
    unittest.main()
