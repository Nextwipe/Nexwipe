"""Org setup file and stick id on the stick's visible section. Run: python3 -m unittest discover -s tests"""
import json
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from nd_station import setup_file  # noqa: E402

KEY = "ndstk_" + "a1" * 32


class WifiCommandTests(unittest.TestCase):
    def test_join_command_allowed_and_nothing_else(self):
        from nd_station import safety
        safety.check(setup_file.wifi_join_argv({"ssid": "Bench WiFi", "password": "secret123"}))
        safety.check(setup_file.wifi_join_argv({"ssid": "Open bench", "password": ""}))
        for bad in (["nmcli", "connection", "delete", "Bench"], ["nmcli", "device", "wifi", "connect", "x" * 40],
                    ["nmcli", "general", "reload"]):
            with self.assertRaises(safety.Refused, msg=bad):
                safety.check(bad)


class SetupFileTests(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()

    def write(self, data):
        with open(os.path.join(self.root, setup_file.SETUP_NAME), "w") as f:
            f.write(data if isinstance(data, str) else json.dumps(data))

    def test_load_valid_without_wifi(self):
        self.write({"server": "https://nexwipe.co/", "stick_key": KEY, "org_name": "Acme ITAD"})
        s = setup_file.load(self.root)
        self.assertEqual((s["server"], s["stick_key"], s["org_name"], s["wifi"]), ("https://nexwipe.co", KEY, "Acme ITAD", None))

    def test_load_wifi(self):
        self.write({"server": "https://nexwipe.co", "stick_key": KEY, "wifi": {"ssid": "Bench WiFi", "password": "secret123"}})
        self.assertEqual(setup_file.load(self.root)["wifi"], {"ssid": "Bench WiFi", "password": "secret123"})

    def test_load_rejects_http_server(self):
        self.write({"server": "http://nexwipe.co", "stick_key": KEY})
        with self.assertRaises(ValueError):
            setup_file.load(self.root)

    def test_load_allows_http_for_lab_host(self):
        self.write({"server": "http://10.0.2.2:8080", "stick_key": KEY})
        self.assertEqual(setup_file.load(self.root, ["10.0.2.2"])["server"], "http://10.0.2.2:8080")

    def test_load_without_stick_key_keeps_server(self):
        # setup file from the current Prepare USB stick (one-time token for the Windows helper)
        self.write({"server": "https://nexwipe.co", "enrollment_token": "ndenr_" + "0" * 48})
        s = setup_file.load(self.root)
        self.assertEqual((s["server"], s["stick_key"]), ("https://nexwipe.co", None))

    def test_load_rejects_bad_key_and_bad_wifi(self):
        for bad in ({"server": "https://x.co", "stick_key": "ndenr_123"},
                    {"server": "https://x.co", "stick_key": KEY, "wifi": {"ssid": "", "password": "secret123"}},
                    {"server": "https://x.co", "stick_key": KEY, "wifi": {"ssid": "x" * 33, "password": "secret123"}},
                    {"server": "https://x.co", "stick_key": KEY, "wifi": {"ssid": "ok", "password": "short"}}):
            self.write(bad)
            with self.assertRaises(ValueError, msg=bad):
                setup_file.load(self.root)

    def test_load_missing_or_garbage(self):
        with self.assertRaises(ValueError):
            setup_file.load(self.root)
        self.write("{not json")
        with self.assertRaises(ValueError):
            setup_file.load(self.root)

    def test_stick_id_created_once(self):
        a = setup_file.stick_id(self.root)
        self.assertRegex(a, r"^[0-9a-f]{32}$")
        self.assertEqual(setup_file.stick_id(self.root), a)

    def test_stick_id_garbage_file_replaced(self):
        with open(os.path.join(self.root, setup_file.STICK_ID_NAME), "w") as f:
            f.write("copied-by-hand\n")
        self.assertRegex(setup_file.stick_id(self.root), r"^[0-9a-f]{32}$")

    def test_find_root(self):
        other = tempfile.mkdtemp()
        self.write({})
        self.assertEqual(setup_file.find_root((other, self.root)), self.root)
        self.assertIsNone(setup_file.find_root((other,)))


if __name__ == "__main__":
    unittest.main()
