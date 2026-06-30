import unittest
from parse_data import clean_event_name

class TestCleanEventName(unittest.TestCase):
    def test_basic_event_name(self):
        name, section = clean_event_name("Business Communication")
        self.assertEqual(name, "Business Communication")
        self.assertEqual(section, "Main")

    def test_section_extraction(self):
        name, section = clean_event_name("Accounting I - Section 1")
        self.assertEqual(name, "Accounting I")
        self.assertEqual(section, "Section 1")

        name, section = clean_event_name("Business Ethics - section 12")
        self.assertEqual(name, "Business Ethics")
        self.assertEqual(section, "Section 12")

    def test_objective_test(self):
        name, section = clean_event_name("Agribusiness - Objective Test")
        self.assertEqual(name, "Agribusiness")
        self.assertEqual(section, "Objective Test")

        name, section = clean_event_name("Agribusiness - Objective")
        self.assertEqual(name, "Agribusiness")
        self.assertEqual(section, "Objective Test")

    def test_complex_prelims_presentation(self):
        name, section = clean_event_name("Broadcast Journalism - Prelims - Section 2 - Presentation")
        self.assertEqual(name, "Broadcast Journalism")
        self.assertEqual(section, "Section 2")

        name, section = clean_event_name("Broadcast Journalism - Prelim - Section 1 - Presentation")
        self.assertEqual(name, "Broadcast Journalism")
        self.assertEqual(section, "Section 1")

    def test_prelims_section(self):
        name, section = clean_event_name("Client Service - Prelims - Section 3")
        self.assertEqual(name, "Client Service")
        self.assertEqual(section, "Section 3")

    def test_prelims_only(self):
        name, section = clean_event_name("Coding & Programming - Prelims")
        self.assertEqual(name, "Coding & Programming")
        self.assertEqual(section, "Main")

    def test_presentation_only(self):
        name, section = clean_event_name("Data Analysis - Presentation")
        self.assertEqual(name, "Data Analysis")
        self.assertEqual(section, "Main")

    def test_performance_only(self):
        name, section = clean_event_name("Impromptu Speaking - Performance")
        self.assertEqual(name, "Impromptu Speaking")
        self.assertEqual(section, "Main")

    def test_trailing_dashes_and_spaces(self):
        name, section = clean_event_name("Future Business Leader - ")
        self.assertEqual(name, "Future Business Leader")
        self.assertEqual(section, "Main")

        name, section = clean_event_name("Job Interview -")
        self.assertEqual(name, "Job Interview")
        self.assertEqual(section, "Main")

if __name__ == '__main__':
    unittest.main()
