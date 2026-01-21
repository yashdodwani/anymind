from anymind import Agent

# Initialize agent with wallet address for authentication
agent = Agent(
    agent_id="custom-b06c4cf5",
    chat_id="872a89c7-181d-405e-a20a-01dd539e7e69",
    wallet_address="0x90df1528054FFccA5faE38EC6447f1557168620E",
    base_url="http://localhost:8000"  # Optional: defaults to http://localhost:8000
)

# Send a message to the agent
# The message is saved to chat history and memory is automatically updated
response = agent.chat("Hello, how can you help me today?")

print(response)